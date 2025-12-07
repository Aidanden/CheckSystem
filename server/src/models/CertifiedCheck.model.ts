import prisma from '../lib/prisma';
import { CertifiedCheckLog, CertifiedCheckSerial } from '@prisma/client';

export interface CreateCertifiedCheckLogData {
    branchId: number;
    branchName: string;
    accountingNumber: string;
    routingNumber: string;
    firstSerial: number;
    lastSerial: number;
    totalChecks: number;
    operationType: 'print' | 'reprint';
    printedBy: number;
    printedByName: string;
    notes?: string;
}

export class CertifiedCheckModel {
    // Get or create serial tracker for a branch
    static async getOrCreateSerial(branchId: number): Promise<CertifiedCheckSerial> {
        let serial = await prisma.certifiedCheckSerial.findUnique({
            where: { branchId },
        });

        if (!serial) {
            serial = await prisma.certifiedCheckSerial.create({
                data: {
                    branchId,
                    lastSerial: 0,
                },
            });
        }

        return serial;
    }

    // Get next serial range for printing (50 checks per book)
    static async getNextSerialRange(branchId: number, checksCount: number = 50): Promise<{ firstSerial: number; lastSerial: number }> {
        const serial = await this.getOrCreateSerial(branchId);
        const firstSerial = serial.lastSerial + 1;
        const lastSerial = serial.lastSerial + checksCount;
        return { firstSerial, lastSerial };
    }

    // Print a new certified check book
    static async printBook(data: CreateCertifiedCheckLogData): Promise<CertifiedCheckLog> {
        return prisma.$transaction(async (tx) => {
            // Update the serial tracker
            await tx.certifiedCheckSerial.upsert({
                where: { branchId: data.branchId },
                update: { lastSerial: data.lastSerial },
                create: {
                    branchId: data.branchId,
                    lastSerial: data.lastSerial,
                },
            });

            // Create the print log
            const log = await tx.certifiedCheckLog.create({
                data: {
                    branchId: data.branchId,
                    branchName: data.branchName,
                    accountingNumber: data.accountingNumber,
                    routingNumber: data.routingNumber,
                    firstSerial: data.firstSerial,
                    lastSerial: data.lastSerial,
                    totalChecks: data.totalChecks,
                    operationType: data.operationType,
                    printedBy: data.printedBy,
                    printedByName: data.printedByName,
                    notes: data.notes,
                },
            });

            return log;
        });
    }

    // Get all print logs
    static async findAllLogs(options?: {
        skip?: number;
        take?: number;
        branchId?: number;
        startDate?: Date;
        endDate?: Date;
    }): Promise<{ logs: CertifiedCheckLog[]; total: number }> {
        const where: any = {};

        if (options?.branchId) {
            where.branchId = options.branchId;
        }

        if (options?.startDate || options?.endDate) {
            where.printDate = {};
            if (options.startDate) {
                where.printDate.gte = options.startDate;
            }
            if (options.endDate) {
                where.printDate.lte = options.endDate;
            }
        }

        const [logs, total] = await Promise.all([
            prisma.certifiedCheckLog.findMany({
                where,
                skip: options?.skip,
                take: options?.take,
                orderBy: { printDate: 'desc' },
                include: {
                    user: {
                        select: {
                            id: true,
                            username: true,
                        },
                    },
                    branch: {
                        select: {
                            id: true,
                            branchName: true,
                        },
                    },
                },
            }),
            prisma.certifiedCheckLog.count({ where }),
        ]);

        return { logs, total };
    }

    // Get log by ID
    static async findLogById(id: number): Promise<CertifiedCheckLog | null> {
        return prisma.certifiedCheckLog.findUnique({
            where: { id },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                    },
                },
                branch: {
                    select: {
                        id: true,
                        branchName: true,
                    },
                },
            },
        });
    }

    // Get last printed serial for a branch
    static async getLastSerial(branchId: number): Promise<number> {
        const serial = await prisma.certifiedCheckSerial.findUnique({
            where: { branchId },
        });
        return serial?.lastSerial || 0;
    }

    // Get statistics
    static async getStatistics(branchId?: number): Promise<{
        totalBooks: number;
        totalChecks: number;
        lastPrintDate: Date | null;
    }> {
        const where: any = {};
        if (branchId) {
            where.branchId = branchId;
        }

        const stats = await prisma.certifiedCheckLog.aggregate({
            where,
            _count: { id: true },
            _sum: { totalChecks: true },
            _max: { printDate: true },
        });

        return {
            totalBooks: stats._count.id || 0,
            totalChecks: stats._sum.totalChecks || 0,
            lastPrintDate: stats._max.printDate || null,
        };
    }

    // Get all branch serials with branch info
    static async getAllBranchSerials(): Promise<Array<{
        branchId: number;
        branchName: string;
        lastSerial: number;
    }>> {
        const serials = await prisma.certifiedCheckSerial.findMany({
            include: {
                branch: {
                    select: {
                        id: true,
                        branchName: true,
                    },
                },
            },
        });

        return serials.map(s => ({
            branchId: s.branchId,
            branchName: s.branch.branchName,
            lastSerial: s.lastSerial,
        }));
    }
}
