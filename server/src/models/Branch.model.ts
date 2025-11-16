import prisma from '../lib/prisma';
import { Branch } from '@prisma/client';

export class BranchModel {
  static async findAll(): Promise<Branch[]> {
    return prisma.branch.findMany({
      orderBy: { id: 'asc' },
    });
  }

  static async findById(id: number): Promise<Branch | null> {
    return prisma.branch.findUnique({
      where: { id },
    });
  }

  static async findByRoutingNumber(routingNumber: string): Promise<Branch | null> {
    return prisma.branch.findUnique({
      where: { routingNumber },
    });
  }

  static async create(branch: {
    branchName: string;
    branchLocation: string;
    routingNumber: string;
  }): Promise<Branch> {
    return prisma.branch.create({
      data: branch,
    });
  }

  static async update(
    id: number,
    branch: {
      branchName?: string;
      branchLocation?: string;
      routingNumber?: string;
    }
  ): Promise<Branch | null> {
    return prisma.branch.update({
      where: { id },
      data: branch,
    });
  }

  static async delete(id: number): Promise<boolean> {
    try {
      await prisma.branch.delete({
        where: { id },
      });
      return true;
    } catch {
      return false;
    }
  }
}
