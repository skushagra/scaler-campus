import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

class BatchController {

    public prisma: PrismaClient; // Prisma Client to interact with database

    constructor() {
        this.prisma = new PrismaClient();
        this.getBatch = this.getBatch.bind(this);
        this.getBatchById = this.getBatchById.bind(this);
        this.createBatch = this.createBatch.bind(this);
        this.updateBatch = this.updateBatch.bind(this);
        this.deleteBatch = this.deleteBatch.bind(this);
        this.getBatchStudents = this.getBatchStudents.bind(this);
        this.addBatchStudents = this.addBatchStudents.bind(this);
    }

    async getBatch(req : Request, res : Response) {
        // Get all batches
        const batches = await this.prisma.batch.findMany();

        // Send response
        res.json({ message: 'Get Batches', data: batches });
    }

    async getBatchById(req : Request, res : Response) {
        // Get batch by ID
        const {batchId} = req.params;

        //validate data
        if (!batchId) {
            return res.status(400).json({ message: 'Batch ID is required' });
        }

        // Get batch by ID
        const batch = await this.prisma.batch.findUnique({
            where: {
                BatchId: parseInt(batchId)
            }
        });

        // Send response
        res.json({ message: 'Get Batch by ID', data : batch });

    }

    async getBatchStudents(req : Request, res : Response) {
        // Get batch students
        const {batchId} = req.params;

        //validate data
        if (!batchId) {
            return res.status(400).json({ message: 'Batch ID is required' });
        }

        // Get batch
        const batch = await this.prisma.batch.findUnique({
            where: {
                BatchId: parseInt(batchId)
            }
        });

        //validate data
        if (!batch) {
            return res.status(400).json({ message: 'Batch not found' });
        }

        // Get students
        const students = await this.prisma.batchStudents.findMany({
            where: {
                BatchId: parseInt(batchId)
            },
            select: {
                UserId: true,
                BatchId: false,
            },
        }).then((students) => {
            return students.map((student) => {
                return student.UserId;
            });
        }).then((resp) => {
            return this.prisma.user.findMany({
                where: {
                    UserId: {
                        in: resp
                    }
                }
            });
        }).then((data) => {
            // map id to student
            return data.map((student) => {
                return student.Email;
            });
        });

        // Send response
        res.json({data: students });
    }

    async addBatchStudents(req : Request, res : Response) {
        // Add students to batch
        const {batchId} = req.params;
        const {students} = req.body;

        //validate data
        if (!batchId || !students) {
            return res.status(400).json({ message: 'Batch ID and Student ID are required' });
        }

        // Get batch
        const batch = await this.prisma.batch.findUnique({
            where: {
                BatchId: parseInt(batchId)
            }
        });

        //validate data
        if (!batch) {
            return res.status(400).json({ message: 'Batch not found' });
        }

        // Add students to batch
        let message = "";
        students.forEach(async (studentId : number) => {

            // Get student
            const student = await this.prisma.user.findUnique({
                where: {
                    UserId: studentId
                }
            });

            //validate data

            if (student) {
                await this.prisma.batchStudents.create({
                    data: {
                        BatchId: parseInt(batchId),
                        UserId: studentId
                    }
                });   
            } else {
                message += `Student with ID ${studentId} not found. `;
            }
        });

        // Get students
        const newBatchStudent = await this.prisma.batchStudents.findMany({
            where: {
                BatchId: parseInt(batchId)
            }
        });

        // Send response
        res.json({ message: 'Students added to batch' + message, data: newBatchStudent });
    }

    async createBatch(req : Request, res : Response) {
        // Create new batch
        const {name, desc} = req.body;

        //validate data
        if (!name || !desc) {
            return res.status(400).json({ message: 'Name and Description are required' });
        }

        // Create new batch
        const newBatch = await this.prisma.batch.create({
            data: {
                Name: name,
                Description: desc
            }
        })

        // Send response
        res.json({ message: 'Batch Created', data: newBatch });
    }

    async updateBatch(req : Request, res : Response) {

        // Update batch
        const {batchId} = req.params;
        let {name, desc} = req.body;

        // get the batch
        const batch = await this.prisma.batch.findUnique({
            where: {
                BatchId: parseInt(batchId)
            }
        });

        // validate data
        if (!batch) {
            return res.status(400).json({ message: 'Batch not found' });
        }

        // fix batch data
        if(!name) {
            name = batch.Name;
        }
        if(!desc) {
            desc = batch.Description;
        }

        // Update batch
        const updatedBatch = await this.prisma.batch.update({
            where: {
                BatchId: parseInt(batchId)
            },
            data: {
                Name: name,
                Description: desc
            }
        });

        // Send response
        res.json({ message: 'Update Batch', data: updatedBatch });
    }

    async deleteBatch(req : Request, res : Response) {

        // get batch id
        const {batchId} = req.params;

        // validate data
        if (!batchId) {
            return res.status(400).json({ message: 'Batch ID is required' });
        }

        // check if batch exists
        const batch = await this.prisma.batch.findUnique({
            where: {
                BatchId: parseInt(batchId)
            }
        });

        // validate data
        if (!batch) {
            return res.status(400).json({ message: 'Batch not found' });
        }

        // Delete batch
        // await this.prisma.batch.delete({
        //     where: {
        //         BatchId: parseInt(batchId)
        //     }
        // });

        res.json({ message: 'Delete Batch' });
    }

}

export default BatchController;