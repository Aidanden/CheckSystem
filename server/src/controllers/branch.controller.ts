import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { BranchService } from '../services/branch.service';
import { CreateBranchRequest } from '../types';

export class BranchController {
  static async getAll(_req: AuthRequest, res: Response): Promise<void> {
    try {
      const branches = await BranchService.getAllBranches();
      res.json(branches);
    } catch (error) {
      if (error instanceof Error) {
        res.status(500).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to fetch branches' });
      }
    }
  }

  static async getById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const branch = await BranchService.getBranchById(id);
      res.json(branch);
    } catch (error) {
      if (error instanceof Error) {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to fetch branch' });
      }
    }
  }

  static async create(req: AuthRequest, res: Response): Promise<void> {
    try {
      const data: CreateBranchRequest = req.body;
      const branch = await BranchService.createBranch(data);
      res.status(201).json(branch);
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to create branch' });
      }
    }
  }

  static async update(req: AuthRequest, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const data: Partial<CreateBranchRequest> = req.body;
      const branch = await BranchService.updateBranch(id, data);
      res.json(branch);
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to update branch' });
      }
    }
  }

  static async delete(req: AuthRequest, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      await BranchService.deleteBranch(id);
      res.json({ message: 'Branch deleted successfully' });
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to delete branch' });
      }
    }
  }
}

