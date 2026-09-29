import { randomUUID } from 'node:crypto'

export async function seed(knex) {
  await knex('templates').insert([
    { id: randomUUID(), name: 'Canvas', description: 'A roomy, image-led portfolio layout.', preview_url: '/#projects', active: true },
    { id: randomUUID(), name: 'Index', description: 'A compact layout with a profile sidebar.', preview_url: '/#about', active: true },
  ]).onConflict('name').merge(['description', 'preview_url', 'active'])
}