import { Hono } from 'hono'
import { getCookie } from 'hono/cookie'
import { sign, verify } from 'hono/jwt'
import { getDB } from './database-neon'
import { getLoggedInUser } from './auth'

const app = new Hono()

// Get comments for an article or resource
app.get('/comments', async (c) => {
  try {
    const { articleId, resourceId, search = '', sort = 'newest', filter = 'all' } = c.req.query()
    const currentUser = await getLoggedInUser(c)

    let query;
    let params: any[] = []
    
    if (articleId) {
      query = `
        SELECT 
          c.*,
          u.name as author_name,
          u.role as author_role,
          CASE 
            WHEN cl.id IS NOT NULL THEN true 
            ELSE false 
          END as user_liked,
          COALESCE(c.like_count, 0) as like_count
        FROM comments c
        JOIN users u ON c.author_id = u.id
        LEFT JOIN comment_likes cl ON c.id = cl.comment_id AND cl.user_id = $1
        WHERE c.article_id = $2 AND c.status = 'approved'
      `
      params = [currentUser?.id || null, parseInt(articleId)]
    } else if (resourceId) {
      query = `
        SELECT 
          c.*,
          u.name as author_name,
          u.role as author_role,
          CASE 
            WHEN cl.id IS NOT NULL THEN true 
            ELSE false 
          END as user_liked,
          COALESCE(c.like_count, 0) as like_count
        FROM comments c
        JOIN users u ON c.author_id = u.id
        LEFT JOIN comment_likes cl ON c.id = cl.comment_id AND cl.user_id = $1
        WHERE c.resource_id = $2 AND c.status = 'approved'
      `
      params = [currentUser?.id || null, parseInt(resourceId)]
    } else {
      return c.json({ error: 'Article ID or Resource ID required' }, 400)
    }

    // Add search filter
    if (search) {
      query += ` AND (c.content ILIKE $${params.length + 1} OR u.name ILIKE $${params.length + 1})`
      params.push(`%${search}%`)
    }

    // Add filter conditions
    if (filter === 'pinned') {
      query += ` AND c.pinned = true`
    } else if (filter === 'liked' && currentUser) {
      query += ` AND cl.id IS NOT NULL`
    }

    // Add sorting
    switch (sort) {
      case 'oldest':
        query += ` ORDER BY c.pinned DESC, c.created_at ASC`
        break
      case 'popular':
        query += ` ORDER BY c.pinned DESC, c.like_count DESC, c.created_at DESC`
        break
      default: // newest
        query += ` ORDER BY c.pinned DESC, c.created_at DESC`
    }

    const sql = getDB()
    const result = await sql.unsafe(query, params)
    
    // Organize comments with replies
    const commentMap = new Map()
    const rootComments = []

    for (const row of result) {
      const comment = {
        id: row.id,
        content: row.content,
        author: row.author_name,
        authorRole: row.author_role,
        badge: getBadgeFromRole(row.author_role),
        avatar: getAvatarFromRole(row.author_role),
        timestamp: formatTimestamp(row.created_at),
        likes: row.like_count || 0,
        liked: row.user_liked || false,
        pinned: row.pinned || false,
        edited: row.edited || false,
        parentId: row.parent_id,
        replies: []
      }

      commentMap.set(comment.id, comment)

      if (comment.parentId) {
        const parent = commentMap.get(comment.parentId)
        if (parent) {
          parent.replies.push(comment)
        }
      } else {
        rootComments.push(comment)
      }
    }

    return c.json({ 
      success: true, 
      comments: rootComments,
      total: rootComments.length
    })

  } catch (error) {
    console.error('Error fetching comments:', error)
    return c.json({ error: 'Failed to fetch comments' }, 500)
  }
})

// Create new comment
app.post('/comments', async (c) => {
  try {
    const user = await getLoggedInUser(c)
    if (!user) {
      return c.json({ error: 'Authentication required' }, 401)
    }

    const { content, articleId, resourceId, parentId } = await c.req.json()

    if (!content || !content.trim()) {
      return c.json({ error: 'Content is required' }, 400)
    }

    if (!articleId && !resourceId) {
      return c.json({ error: 'Article ID or Resource ID required' }, 400)
    }

    // Insert comment
    const sql = getDB()
    const result = await sql`
      INSERT INTO comments (content, author_id, article_id, resource_id, parent_id, status)
      VALUES (${content.trim()}, ${user.id}, ${articleId || null}, ${resourceId || null}, ${parentId || null}, 'approved')
      RETURNING *
    `

    const newComment = result[0]
    
    return c.json({ 
      success: true, 
      comment: {
        id: newComment.id,
        content: newComment.content,
        author: user.name,
        authorRole: user.role,
        badge: getBadgeFromRole(user.role),
        avatar: getAvatarFromRole(user.role),
        timestamp: 'now',
        likes: 0,
        liked: false,
        pinned: false,
        edited: false,
        replies: []
      }
    })

  } catch (error) {
    console.error('Error creating comment:', error)
    return c.json({ error: 'Failed to create comment' }, 500)
  }
})

// Like/unlike comment
app.post('/comments/:id/like', async (c) => {
  try {
    const user = await getLoggedInUser(c)
    if (!user) {
      return c.json({ error: 'Authentication required' }, 401)
    }

    const commentId = parseInt(c.req.param('id'))
    const sql = getDB()
    
    // Check if already liked
    const existingLike = await sql`
      SELECT id FROM comment_likes 
      WHERE user_id = ${user.id} AND comment_id = ${commentId}
    `

    let liked = false
    let likeCount = 0

    if (existingLike.length > 0) {
      // Unlike - remove like
      await sql`
        DELETE FROM comment_likes 
        WHERE user_id = ${user.id} AND comment_id = ${commentId}
      `
      
      await sql`
        UPDATE comments 
        SET like_count = GREATEST(like_count - 1, 0) 
        WHERE id = ${commentId}
      `
      
      liked = false
    } else {
      // Like - add like
      await sql`
        INSERT INTO comment_likes (user_id, comment_id) 
        VALUES (${user.id}, ${commentId})
      `
      
      await sql`
        UPDATE comments 
        SET like_count = like_count + 1 
        WHERE id = ${commentId}
      `
      
      liked = true
    }

    // Get updated like count
    const comment = await sql`
      SELECT like_count FROM comments WHERE id = ${commentId}
    `
    
    likeCount = comment[0]?.like_count || 0

    return c.json({ 
      success: true, 
      liked, 
      likes: likeCount 
    })

  } catch (error) {
    console.error('Error toggling like:', error)
    return c.json({ error: 'Failed to toggle like' }, 500)
  }
})

// Pin/unpin comment (admin only)
app.post('/comments/:id/pin', async (c) => {
  try {
    const user = await getLoggedInUser(c)
    if (!user || (user.role !== 'admin' && user.role !== 'moderator')) {
      return c.json({ error: 'Admin/moderator access required' }, 403)
    }

    const commentId = parseInt(c.req.param('id'))
    const sql = getDB()
    
    // Toggle pinned status
    const comment = await sql`
      SELECT pinned FROM comments WHERE id = ${commentId}
    `
    
    if (comment.length === 0) {
      return c.json({ error: 'Comment not found' }, 404)
    }

    const newPinnedStatus = !comment[0].pinned
    
    await sql`
      UPDATE comments 
      SET pinned = ${newPinnedStatus}, updated_at = NOW()
      WHERE id = ${commentId}
    `

    return c.json({ 
      success: true, 
      pinned: newPinnedStatus 
    })

  } catch (error) {
    console.error('Error toggling pin:', error)
    return c.json({ error: 'Failed to toggle pin' }, 500)
  }
})

// Edit comment
app.put('/comments/:id', async (c) => {
  try {
    const user = await getLoggedInUser(c)
    if (!user) {
      return c.json({ error: 'Authentication required' }, 401)
    }

    const commentId = parseInt(c.req.param('id'))
    const { content } = await c.req.json()

    if (!content || !content.trim()) {
      return c.json({ error: 'Content is required' }, 400)
    }

    const sql = getDB()
    
    // Check if user owns the comment or is admin/moderator
    const comment = await sql`
      SELECT author_id FROM comments WHERE id = ${commentId}
    `
    
    if (comment.length === 0) {
      return c.json({ error: 'Comment not found' }, 404)
    }

    const canEdit = comment[0].author_id === user.id || 
                   user.role === 'admin' || 
                   user.role === 'moderator'

    if (!canEdit) {
      return c.json({ error: 'Permission denied' }, 403)
    }

    await sql`
      UPDATE comments 
      SET content = ${content.trim()}, edited = true, updated_at = NOW()
      WHERE id = ${commentId}
    `

    return c.json({ success: true })

  } catch (error) {
    console.error('Error editing comment:', error)
    return c.json({ error: 'Failed to edit comment' }, 500)
  }
})

// Delete comment
app.delete('/comments/:id', async (c) => {
  try {
    const user = await getLoggedInUser(c)
    if (!user) {
      return c.json({ error: 'Authentication required' }, 401)
    }

    const commentId = parseInt(c.req.param('id'))
    const sql = getDB()

    // Check if user owns the comment or is admin/moderator
    const comment = await sql`
      SELECT author_id FROM comments WHERE id = ${commentId}
    `
    
    if (comment.length === 0) {
      return c.json({ error: 'Comment not found' }, 404)
    }

    const canDelete = comment[0].author_id === user.id || 
                     user.role === 'admin' || 
                     user.role === 'moderator'

    if (!canDelete) {
      return c.json({ error: 'Permission denied' }, 403)
    }

    await sql`DELETE FROM comments WHERE id = ${commentId}`

    return c.json({ success: true })

  } catch (error) {
    console.error('Error deleting comment:', error)
    return c.json({ error: 'Failed to delete comment' }, 500)
  }
})

// Helper functions
function getBadgeFromRole(role: string): string {
  switch (role) {
    case 'admin': return 'Admin'
    case 'moderator': return 'Moderator'  
    case 'user': return 'Member'
    default: return 'Member'
  }
}

function getAvatarFromRole(role: string): string {
  switch (role) {
    case 'admin': return '👑'
    case 'moderator': return '🛡️'
    case 'user': return '😊'
    default: return '😊'
  }
}

function formatTimestamp(date: Date): string {
  const now = new Date()
  const diff = Math.floor((now.getTime() - new Date(date).getTime()) / 1000)

  if (diff < 60) return 'now'
  if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`
  if (diff < 604800) return `${Math.floor(diff / 86400)} days ago`
  
  return new Date(date).toLocaleDateString()
}

export default app