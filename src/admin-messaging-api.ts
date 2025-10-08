import { Hono } from 'hono'
import { getLoggedInUser, authMiddleware } from './auth'
import {
  createAdminMessage,
  getAdminMessages,
  getAdminMessagesByRole,
  deleteAdminMessage
} from './database-neon'

// Cloudflare Workers types
interface CloudflareWebSocket extends WebSocket {
  accept(): void
}

interface CloudflareWebSocketPair {
  0: CloudflareWebSocket
  1: CloudflareWebSocket
}

declare const WebSocketPair: {
  new (): CloudflareWebSocketPair
}

interface DurableObjectState {
  id: string
  storage: any
}

interface CloudflareResponseInit extends ResponseInit {
  webSocket?: CloudflareWebSocket
}

interface DurableObjectNamespace {
  idFromName(name: string): string
  get(id: string): DurableObjectStub
}

interface DurableObjectStub {
  fetch(request: string | Request): Promise<Response>
}

interface CloudflareEnv {
  CHAT_ROOM: DurableObjectNamespace
}

const adminMessagingApi = new Hono()

// Durable Object for WebSocket connections
export class ChatRoom {
  state: DurableObjectState
  connections: Map<WebSocket, { userId: number; userName: string; userRole: string }>

  constructor(state: DurableObjectState) {
    this.state = state
    this.connections = new Map()
  }

  async fetch(request: Request) {
    const upgradeHeader = request.headers.get('Upgrade')
    if (upgradeHeader !== 'websocket') {
      return new Response('Expected websocket', { status: 400 })
    }

    const [client, server] = Object.values(new WebSocketPair())
    server.accept()

    // Get user info from request (this would come from authentication)
    const url = new URL(request.url)
    const userId = parseInt(url.searchParams.get('userId') || '0')
    const userName = url.searchParams.get('userName') || 'Unknown'
    const userRole = url.searchParams.get('userRole') || 'user'

    // Store connection
    this.connections.set(server, { userId, userName, userRole })

    // Send welcome message
    server.send(JSON.stringify({
      type: 'welcome',
      message: `Welcome ${userName}!`,
      onlineCount: this.connections.size
    }))

    // Broadcast user joined
    this.broadcast({
      type: 'user_joined',
      userName,
      userRole,
      onlineCount: this.connections.size
    }, server)

    server.addEventListener('message', async (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data as string)

        switch (data.type) {
          case 'message':
            await this.handleMessage(server, data)
            break
          case 'typing':
            this.handleTyping(server, data)
            break
          case 'delete_message':
            await this.handleDeleteMessage(server, data)
            break
        }
      } catch (error) {
        console.error('Error handling message:', error)
      }
    })

    server.addEventListener('close', () => {
      this.connections.delete(server)
      // Broadcast user left
      this.broadcast({
        type: 'user_left',
        userName,
        userRole,
        onlineCount: this.connections.size
      })
    })

    return new Response(null, { status: 101, webSocket: client } as CloudflareResponseInit)
  }

  async handleMessage(ws: WebSocket, data: any) {
    const userInfo = this.connections.get(ws)
    if (!userInfo) return

    try {
      // Create message in database
      const message = await createAdminMessage(
        data.content,
        userInfo.userId,
        userInfo.userName,
        userInfo.userRole as 'admin' | 'moderator',
        {
          mediaUrl: data.mediaUrl,
          mediaType: data.mediaType,
          fileName: data.fileName,
          fileSize: data.fileSize,
          isHighlighted: data.isHighlighted
        }
      )

      // Broadcast new message to all clients
      this.broadcast({
        type: 'new_message',
        message,
        onlineCount: this.connections.size
      })
    } catch (error) {
      console.error('Error creating message:', error)
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Failed to send message'
      }))
    }
  }

  handleTyping(ws: WebSocket, data: any) {
    const userInfo = this.connections.get(ws)
    if (!userInfo) return

    // Broadcast typing status
    this.broadcast({
      type: 'typing',
      userId: userInfo.userId,
      userName: userInfo.userName,
      isTyping: data.isTyping,
      onlineCount: this.connections.size
    }, ws) // Exclude sender
  }

  async handleDeleteMessage(ws: WebSocket, data: any) {
    const userInfo = this.connections.get(ws)
    if (!userInfo) return

    try {
      const success = await deleteAdminMessage(data.messageId, userInfo.userId, userInfo.userRole)

      if (success) {
        // Broadcast message deletion
        this.broadcast({
          type: 'message_deleted',
          messageId: data.messageId,
          deletedBy: userInfo.userName,
          onlineCount: this.connections.size
        })
      } else {
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Failed to delete message'
        }))
      }
    } catch (error) {
      console.error('Error deleting message:', error)
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Failed to delete message'
      }))
    }
  }

  broadcast(message: any, excludeWs?: WebSocket) {
    const messageStr = JSON.stringify(message)
    for (const [ws, userInfo] of this.connections) {
      if (ws !== excludeWs && ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(messageStr)
        } catch (error) {
          console.error('Error broadcasting to client:', error)
          this.connections.delete(ws)
        }
      }
    }
  }
}

// Global store for tracking online users (fallback for non-WebSocket clients)
const onlineUsers = new Map<number, { name: string; role: string; connectedAt: number }>()

// Global flag to trigger immediate message updates (for SSE fallback)
let shouldUpdateMessages = false

// Apply auth middleware to all admin messaging routes
adminMessagingApi.use('*', authMiddleware)

// GET /api/admin/messages - Get all admin messages with filtering
adminMessagingApi.get('/messages', async (c) => {
  try {
    const user = c.get('user')
    if (!user) {
      return c.json({ error: 'Authentication required' }, 401)
    }

    // Only admins and moderators can access messages
    if (user.role !== 'admin' && user.role !== 'moderator') {
      return c.json({ error: 'Access denied' }, 403)
    }

    const limit = parseInt(c.req.query('limit') || '20')
    const page = parseInt(c.req.query('page') || '1')
    const offset = (page - 1) * limit
    const role = c.req.query('role') as 'admin' | 'moderator' | undefined
    const search = c.req.query('search')
    const sort = c.req.query('sort') || 'oldest'
    const dateRange = c.req.query('dateRange')
    const dateFrom = c.req.query('dateFrom')
    const dateTo = c.req.query('dateTo')
    const mediaType = c.req.query('mediaType')
    const status = c.req.query('status')

    // Build filter object
    const filters = {
      role,
      search,
      sort,
      dateRange,
      dateFrom,
      dateTo,
      mediaType,
      status,
      offset,
      limit
    }

    const { getFilteredAdminMessages } = await import('./database-neon')
    const result = await getFilteredAdminMessages(filters, limit)

    return c.json({
      success: true,
      messages: result.messages,
      totalCount: result.totalCount
    })
  } catch (error) {
    console.error('Error fetching admin messages:', error)
    return c.json({ error: 'Failed to fetch messages' }, 500)
  }
})

// POST /api/admin/messages - Create a new admin message
adminMessagingApi.post('/messages', async (c) => {
  try {
    const user = c.get('user')
    if (!user) {
      return c.json({ error: 'Authentication required' }, 401)
    }

    // Only admins and moderators can post messages
    if (user.role !== 'admin' && user.role !== 'moderator') {
      return c.json({ error: 'Access denied' }, 403)
    }

    // Parse form data instead of JSON
    const formData = await c.req.formData()
    const content = formData.get('content') as string
    const mediaUrl = formData.get('mediaUrl') as string
    const mediaType = formData.get('mediaType') as 'image' | 'video' | 'audio' | 'document'
    const fileName = formData.get('fileName') as string
    const fileSizeStr = formData.get('fileSize') as string
    const fileSize = fileSizeStr ? parseInt(fileSizeStr) : undefined
    const isHighlighted = formData.get('isHighlighted') === 'true'

    if (!content || content.trim().length === 0) {
      return c.json({ error: 'Message content is required' }, 400)
    }

    // Check media upload permissions
    if ((mediaUrl || mediaType || fileName) && user.role !== 'admin') {
      return c.json({ error: 'Only admins can upload media files' }, 403)
    }

    const message = await createAdminMessage(
      content.trim(),
      user.id,
      user.name,
      user.role,
      {
        mediaUrl,
        mediaType,
        fileName,
        fileSize,
        isHighlighted: user.role === 'admin' ? (isHighlighted || false) : false // Only admins can highlight messages
      }
    )

    // Trigger immediate message update for all connected clients
    shouldUpdateMessages = true

    return c.json({ success: true, message }, 201)
  } catch (error) {
    console.error('Error creating admin message:', error)
    return c.json({ error: 'Failed to create message' }, 500)
  }
})

// DELETE /api/admin/messages/:id - Delete an admin message
adminMessagingApi.delete('/messages/:id', async (c) => {
  try {
    const user = c.get('user')
    if (!user) {
      return c.json({ error: 'Authentication required' }, 401)
    }

    // Only admins and moderators can delete messages
    if (user.role !== 'admin' && user.role !== 'moderator') {
      return c.json({ error: 'Access denied' }, 403)
    }

    const messageId = parseInt(c.req.param('id'))
    if (!messageId) {
      return c.json({ error: 'Invalid message ID' }, 400)
    }

    const success = await deleteAdminMessage(messageId, user.id, user.role)

    if (!success) {
      return c.json({ error: 'Message not found or access denied' }, 404)
    }

    // Trigger immediate message update for all connected clients
    shouldUpdateMessages = true

    return c.json({ success: true, message: 'Message deleted successfully' })
  } catch (error) {
    console.error('Error deleting admin message:', error)
    return c.json({ error: 'Failed to delete message' }, 500)
  }
})

// WebSocket endpoint for real-time messaging
adminMessagingApi.get('/messages/ws', async (c: any) => {
  const user = c.get('user')
  if (!user) {
    return c.json({ error: 'Authentication required' }, 401)
  }

  // Only admins and moderators can access real-time chat
  if (user.role !== 'admin' && user.role !== 'moderator') {
    return c.json({ error: 'Access denied' }, 403)
  }

  // Get the Durable Object ID for the chat room
  const id = (c.env as CloudflareEnv).CHAT_ROOM.idFromName('admin-chat-room')
  const chatRoom = (c.env as CloudflareEnv).CHAT_ROOM.get(id)

  // Add user info to the request URL
  const url = new URL(c.req.url)
  url.searchParams.set('userId', user.id.toString())
  url.searchParams.set('userName', user.name)
  url.searchParams.set('userRole', user.role)

  // Forward the request to the Durable Object
  return chatRoom.fetch(url.toString())
})

// Server-Sent Events for real-time messaging (fallback)
adminMessagingApi.get('/messages/events', async (c) => {
  try {
    const user = c.get('user')
    if (!user) {
      return c.json({ error: 'Authentication required' }, 401)
    }

    // Only admins and moderators can access real-time events
    if (user.role !== 'admin' && user.role !== 'moderator') {
      return c.json({ error: 'Access denied' }, 403)
    }

    // Set up SSE headers
    const headers = {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
    }

    // Get initial messages
    const messages = await getAdminMessages(50)

    // Create SSE response
    const stream = new ReadableStream({
      start(controller) {
        // Add user to online users
        onlineUsers.set(user.id, {
          name: user.name,
          role: user.role,
          connectedAt: Date.now()
        })

        console.log(`User ${user.name} (${user.role}) connected. Online users: ${onlineUsers.size}`)

        // Send initial data
        const initialData = `data: ${JSON.stringify({
          type: 'initial',
          messages: messages,
          onlineUsers: Array.from(onlineUsers.values()),
          onlineCount: onlineUsers.size
        })}\n\n`
        controller.enqueue(new TextEncoder().encode(initialData))

        // Send user connected event to all other clients
        // Note: In a production system, you'd use a pub/sub system like Redis
        // For now, we'll just send the updated count

        // Send heartbeat every 30 seconds to keep connection alive
        const heartbeatInterval = setInterval(() => {
          try {
            const heartbeatData = `data: ${JSON.stringify({
              type: 'heartbeat',
              timestamp: Date.now(),
              onlineCount: onlineUsers.size
            })}\n\n`
            controller.enqueue(new TextEncoder().encode(heartbeatData))
          } catch (error) {
            console.error('Error sending heartbeat:', error)
          }
        }, 30000)

        // Set up frequent message updates (every 1 second for real-time feel)
        const messageInterval = setInterval(async () => {
          try {
            // Check if we need to send an immediate update
            if (shouldUpdateMessages) {
              shouldUpdateMessages = false // Reset the flag
              const latestMessages = await getAdminMessages(50)
              const data = `data: ${JSON.stringify({
                type: 'new_message',
                messages: latestMessages,
                onlineCount: onlineUsers.size
              })}\n\n`
              controller.enqueue(new TextEncoder().encode(data))
            }
          } catch (error) {
            console.error('Error sending immediate SSE update:', error)
          }
        }, 1000) // Check every 1 second for immediate updates

        // Clean up on close
        c.req.raw.signal.addEventListener('abort', () => {
          // Remove user from online users
          onlineUsers.delete(user.id)
          console.log(`User ${user.name} (${user.role}) disconnected. Online users: ${onlineUsers.size}`)

          clearInterval(heartbeatInterval)
          clearInterval(messageInterval)
          controller.close()
        })
      }
    })

    return new Response(stream, { headers })
  } catch (error) {
    console.error('Error setting up SSE:', error)
    return c.json({ error: 'Failed to establish connection' }, 500)
  }
})

// PUT /api/admin/messages/:id/status - Update message status
adminMessagingApi.put('/messages/:id/status', async (c) => {
  try {
    const user = c.get('user')
    if (!user) {
      return c.json({ error: 'Authentication required' }, 401)
    }

    // Only admins and moderators can update message status
    if (user.role !== 'admin' && user.role !== 'moderator') {
      return c.json({ error: 'Access denied' }, 403)
    }

    const messageId = parseInt(c.req.param('id'))
    if (!messageId) {
      return c.json({ error: 'Invalid message ID' }, 400)
    }

    const body = await c.req.json()
    const { status } = body

    if (!status || !['sent', 'delivered', 'read'].includes(status)) {
      return c.json({ error: 'Invalid status. Must be sent, delivered, or read' }, 400)
    }

    const { updateAdminMessageStatus } = await import('./database-neon')
    const success = await updateAdminMessageStatus(messageId, status)

    if (!success) {
      return c.json({ error: 'Message not found or update failed' }, 404)
    }

    return c.json({ success: true, message: 'Message status updated successfully' })
  } catch (error) {
    console.error('Error updating message status:', error)
    return c.json({ error: 'Failed to update message status' }, 500)
  }
})

// POST /api/admin/messages/typing - Send typing indicator
adminMessagingApi.post('/messages/typing', async (c) => {
  try {
    const user = c.get('user')
    if (!user) {
      return c.json({ error: 'Authentication required' }, 401)
    }

    // Only admins and moderators can send typing indicators
    if (user.role !== 'admin' && user.role !== 'moderator') {
      return c.json({ error: 'Access denied' }, 403)
    }

    const body = await c.req.json()
    const { isTyping } = body

    if (typeof isTyping !== 'boolean') {
      return c.json({ error: 'isTyping must be a boolean' }, 400)
    }

    // In a real implementation, you might want to store typing state in Redis/cache
    // For now, we'll just broadcast the typing event via SSE
    // The typing event will be handled by the SSE endpoint

    return c.json({
      success: true,
      message: isTyping ? 'Started typing' : 'Stopped typing',
      user: {
        id: user.id,
        name: user.name,
        role: user.role
      },
      isTyping
    })
  } catch (error) {
    console.error('Error handling typing indicator:', error)
    return c.json({ error: 'Failed to handle typing indicator' }, 500)
  }
})

// POST /api/admin/messages/:id/reactions - Add or update reaction to a message
adminMessagingApi.post('/messages/:id/reactions', async (c) => {
  try {
    const user = c.get('user')
    if (!user) {
      return c.json({ error: 'Authentication required' }, 401)
    }

    // Only admins and moderators can react to messages
    if (user.role !== 'admin' && user.role !== 'moderator') {
      return c.json({ error: 'Access denied' }, 403)
    }

    const messageId = parseInt(c.req.param('id'))
    if (!messageId) {
      return c.json({ error: 'Invalid message ID' }, 400)
    }

    const body = await c.req.json()
    const { reactionType } = body

    const validReactions = ['like', 'love', 'laugh', 'angry', 'sad', 'surprise']
    if (!reactionType || !validReactions.includes(reactionType)) {
      return c.json({ error: 'Invalid reaction type. Must be one of: ' + validReactions.join(', ') }, 400)
    }

    // Check if user already reacted to this message
    const { checkUserReaction, addMessageReaction, updateMessageReaction } = await import('./database-neon')
    const existingReaction = await checkUserReaction(messageId, user.id)

    let result
    if (existingReaction) {
      if (existingReaction.reaction_type === reactionType) {
        // User clicked the same reaction, remove it
        const { removeMessageReaction } = await import('./database-neon')
        result = await removeMessageReaction(messageId, user.id)
        return c.json({
          success: true,
          message: 'Reaction removed',
          action: 'removed',
          reactionType: null
        })
      } else {
        // User changed reaction type
        result = await updateMessageReaction(messageId, user.id, reactionType)
        return c.json({
          success: true,
          message: 'Reaction updated',
          action: 'updated',
          reactionType
        })
      }
    } else {
      // Add new reaction
      result = await addMessageReaction(messageId, user.id, reactionType)
      return c.json({
        success: true,
        message: 'Reaction added',
        action: 'added',
        reactionType
      })
    }
  } catch (error) {
    console.error('Error handling message reaction:', error)
    return c.json({ error: 'Failed to handle reaction' }, 500)
  }
})

// GET /api/admin/messages/:id/reactions - Get reactions for a message
adminMessagingApi.get('/messages/:id/reactions', async (c) => {
  try {
    const user = c.get('user')
    if (!user) {
      return c.json({ error: 'Authentication required' }, 401)
    }

    // Only admins and moderators can view reactions
    if (user.role !== 'admin' && user.role !== 'moderator') {
      return c.json({ error: 'Access denied' }, 403)
    }

    const messageId = parseInt(c.req.param('id'))
    if (!messageId) {
      return c.json({ error: 'Invalid message ID' }, 400)
    }

    const { getMessageReactions } = await import('./database-neon')
    const reactions = await getMessageReactions(messageId)

    return c.json({
      success: true,
      reactions
    })
  } catch (error) {
    console.error('Error getting message reactions:', error)
    return c.json({ error: 'Failed to get reactions' }, 500)
  }
})

export default adminMessagingApi