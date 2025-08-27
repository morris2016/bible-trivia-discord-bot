import { Hono } from 'hono'
import { createComment, getComments, deleteComment } from './database-neon'

const commentsApi = new Hono()

// GET /comments?articleId=1 or ?resourceId=1
commentsApi.get('/comments', async (c) => {
  try {
    const articleId = c.req.query('articleId')
    const resourceId = c.req.query('resourceId')
    
    if (!articleId && !resourceId) {
      return c.json({ error: 'Article ID or Resource ID is required' }, 400)
    }
    
    const comments = await getComments(
      articleId ? parseInt(articleId) : undefined,
      resourceId ? parseInt(resourceId) : undefined
    )
    
    return c.json({ comments })
  } catch (error) {
    console.error('Error fetching comments:', error)
    return c.json({ error: 'Failed to fetch comments' }, 500)
  }
})

// POST /comments
commentsApi.post('/comments', async (c) => {
  try {
    const user = c.get('user')
    if (!user) {
      return c.json({ error: 'Authentication required' }, 401)
    }
    
    // Check if user's email is verified (skip for OAuth and admin users)
    if (!user.email_verified && user.auth_provider !== 'google' && user.role !== 'admin') {
      return c.json({ 
        error: 'Please verify your email address before commenting',
        requiresVerification: true,
        userId: user.id
      }, 403)
    }

    const body = await c.req.json()
    const { content, articleId, resourceId, parentId } = body
    
    if (!content || content.trim().length === 0) {
      return c.json({ error: 'Comment content is required' }, 400)
    }
    
    if (content.trim().length > 500) {
      return c.json({ error: 'Comment must be 500 characters or less' }, 400)
    }
    
    if (!articleId && !resourceId) {
      return c.json({ error: 'Article ID or Resource ID is required' }, 400)
    }
    
    const comment = await createComment(
      content.trim(),
      user.id,
      articleId ? parseInt(articleId) : undefined,
      resourceId ? parseInt(resourceId) : undefined,
      parentId ? parseInt(parentId) : undefined
    )
    
    return c.json({ 
      message: 'Comment created successfully', 
      comment 
    }, 201)
  } catch (error) {
    console.error('Error creating comment:', error)
    return c.json({ error: 'Failed to create comment' }, 500)
  }
})

// DELETE /comments/:id
commentsApi.delete('/comments/:id', async (c) => {
  try {
    const user = c.get('user')
    if (!user) {
      return c.json({ error: 'Authentication required' }, 401)
    }

    const commentId = parseInt(c.req.param('id'))
    if (!commentId) {
      return c.json({ error: 'Invalid comment ID' }, 400)
    }
    
    const success = await deleteComment(commentId, user.id)
    
    if (!success) {
      return c.json({ error: 'Comment not found or unauthorized' }, 404)
    }
    
    return c.json({ message: 'Comment deleted successfully' })
  } catch (error) {
    console.error('Error deleting comment:', error)
    return c.json({ error: 'Failed to delete comment' }, 500)
  }
})

export default commentsApi