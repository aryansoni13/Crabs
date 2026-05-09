import { Router, Response } from 'express';
import { authenticateUser, AuthenticatedRequest } from '../middleware/authMiddleware';
import { createUserSupabaseClient } from '../lib/supabaseUserClient';

const router = Router();

// GET groups for an order
router.get('/order/:orderId', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { orderId } = req.params;
    const { department } = req.query;
    const scopedClient = createUserSupabaseClient(req.token!);

    let query = scopedClient
      .from('item_groups')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: true });

    if (department) {
      query = query.eq('department', department);
    }

    const { data: groups, error } = await query;

    if (error) return res.status(400).json({ error: error.message });
    return res.json({ groups });
  } catch (err: any) {
    return res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

// POST to create a new group
router.post('/order/:orderId', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { orderId } = req.params;
    const scopedClient = createUserSupabaseClient(req.token!);

    const { department, name, is_active, selected_item_ids } = req.body;

    if (!department) {
      return res.status(400).json({ error: 'Department is required' });
    }

    const { data: group, error } = await scopedClient
      .from('item_groups')
      .insert({
        order_id: orderId,
        department,
        name: name || 'New Group',
        is_active: is_active || false,
        selected_item_ids: selected_item_ids || []
      })
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    return res.status(201).json({ group });
  } catch (err: any) {
    return res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

// PUT to update a group
router.put('/:groupId', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { groupId } = req.params;
    const scopedClient = createUserSupabaseClient(req.token!);

    const { name, is_active, selected_item_ids } = req.body;
    
    // Build update object
    const updates: any = {};
    if (name !== undefined) updates.name = name;
    if (is_active !== undefined) updates.is_active = is_active;
    if (selected_item_ids !== undefined) updates.selected_item_ids = selected_item_ids;

    const { data: group, error } = await scopedClient
      .from('item_groups')
      .update(updates)
      .eq('id', groupId)
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    return res.json({ group });
  } catch (err: any) {
    return res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

// DELETE a group
router.delete('/:groupId', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { groupId } = req.params;
    const scopedClient = createUserSupabaseClient(req.token!);

    const { error } = await scopedClient
      .from('item_groups')
      .delete()
      .eq('id', groupId);

    if (error) return res.status(400).json({ error: error.message });
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

export default router;
