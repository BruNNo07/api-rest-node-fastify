/* eslint-disable prettier/prettier */
import { afterAll, beforeAll, it,describe, expect, beforeEach } from 'vitest'
import { app } from '../src/app'
import { execSync } from 'node:child_process'
import request from 'supertest'

describe('transaction rotes', () => {
    beforeAll(async () => {
        await app.ready()
    })
    
    afterAll(async () => {
        await app.close()
    })

    beforeEach(() => {
        execSync('npm run knex -- migrate:rollback --all')
        execSync('npm run knex -- migrate:latest')
    })
    
    it('should be able to create a new transaction', async () => {
        await request(app.server)
        .post('/transactions')
        .send({
            title: 'new transactions',
            amount: 5000,
            type: 'entrada'
        })
        .expect(201)
    })

    it('should be able to list transactions', async () => {
        const createTransactionsResponse = await request(app.server)
        .post('/transactions')
        .send({
            title: 'new transactions',
            amount: 5000,
            type: 'entrada'
        })

        const cookies = createTransactionsResponse.get('Set-Cookie')

        const listTransactionResponse = await request(app.server)
        .get('/transactions')
        .set('Cookie', cookies)
        .expect(200)

        expect(listTransactionResponse.body.transactions).toEqual([
            expect.objectContaining({ 
                title: 'new transactions',
                amount: 5000,
            })
        ])
    })

    it('should be able to list specific transaction', async () => {
        const createTransactionsResponse = await request(app.server)
        .post('/transactions')
        .send({
            title: 'new transactions',
            amount: 5000,
            type: 'entrada'
        })

        const cookies = createTransactionsResponse.get('Set-Cookie')

        const listTransactionResponse = await request(app.server)
        .get('/transactions')
        .set('Cookie', cookies)
        .expect(200)

        const transactionId = listTransactionResponse.body.transactions[0].id

        const getTransactionResponse = await request(app.server)
        .get(`/transactions/${transactionId}`)
        .set('Cookie', cookies)
        .expect(200)

        expect(getTransactionResponse.body.transaction).toEqual(
            expect.objectContaining({ 
                title: 'new transactions',
                amount: 5000,
            })
        )
    })

    it('should be able to get summary', async () => {
        const createTransactionsResponse = await request(app.server)
        .post('/transactions')
        .send({
            title: 'new transactions',
            amount: 5000,
            type: 'entrada'
        })

        const cookies = createTransactionsResponse.get('Set-Cookie')

        await request(app.server)
        .post('/transactions')
        .set('Cookie', cookies)
        .send({
            title: 'new transactions',
            amount: 3000,
            type: 'saida'
        })

        const SummaryResponse = await request(app.server)
        .get('/transactions/summary')
        .set('Cookie', cookies)
        .expect(200)

        expect(SummaryResponse.body.summary).toEqual({ 
            amount: 2000,
        })
    })
})

