import express from 'express';

export default function handler(req: any, res: any) {
    res.status(200).send("Express imported successfully!");
}
