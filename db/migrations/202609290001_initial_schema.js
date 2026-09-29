export async function up(knex) {
  await knex.schema.createTable('users', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
    table.string('email', 254).notNullable()
    table.string('password_hash', 60).notNullable()
    table.string('role', 16).notNullable().defaultTo('user')
    table.string('display_name', 80).notNullable()
    table.string('headline', 120).notNullable().defaultTo('')
    table.text('bio').notNullable().defaultTo('')
    table.string('location', 100).notNullable().defaultTo('')
    table.string('photo_url', 500).notNullable().defaultTo('')
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now())
    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now())
    table.check("role IN ('user', 'admin')", [], 'users_role_check')
  })
  await knex.raw('CREATE UNIQUE INDEX users_email_lower_unique ON users (lower(email))')

  await knex.schema.createTable('templates', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
    table.string('name', 40).notNullable().unique()
    table.string('description', 240).notNullable()
    table.string('preview_url', 500).notNullable().defaultTo('')
    table.boolean('active').notNullable().defaultTo(true)
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now())
  })

  await knex.schema.createTable('user_templates', (table) => {
    table.uuid('user_id').primary().references('id').inTable('users').onDelete('CASCADE')
    table.uuid('template_id').notNullable().references('id').inTable('templates').onDelete('RESTRICT')
    table.jsonb('settings').notNullable().defaultTo('{}')
    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now())
  })

  await knex.schema.createTable('projects', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE')
    table.string('title', 100).notNullable()
    table.string('description', 600).notNullable().defaultTo('')
    table.string('github_link', 500).notNullable().defaultTo('')
    table.string('screenshot_url', 500).notNullable().defaultTo('')
    table.integer('position').notNullable().defaultTo(0)
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now())
    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now())
    table.index(['user_id', 'position'])
  })

  await knex.schema.createTable('skills', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE')
    table.string('skill_name', 50).notNullable()
    table.integer('proficiency').notNullable().defaultTo(70)
    table.integer('position').notNullable().defaultTo(0)
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now())
    table.check('proficiency BETWEEN 0 AND 100', [], 'skills_proficiency_check')
    table.index(['user_id', 'position'])
  })

  await knex.schema.createTable('refresh_tokens', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
    table.uuid('family_id').notNullable()
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE')
    table.string('token_hash', 64).notNullable().unique()
    table.timestamp('expires_at', { useTz: true }).notNullable()
    table.timestamp('revoked_at', { useTz: true }).nullable()
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now())
    table.index(['family_id', 'revoked_at'])
  })

  await knex.schema.createTable('audit_logs', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
    table.uuid('user_id').nullable().references('id').inTable('users').onDelete('SET NULL')
    table.string('action', 80).notNullable()
    table.jsonb('metadata').notNullable().defaultTo('{}')
    table.timestamp('timestamp', { useTz: true }).notNullable().defaultTo(knex.fn.now())
    table.index(['user_id', 'timestamp'])
    table.index(['action', 'timestamp'])
  })

  await knex.schema.createTable('contact_messages', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
    table.uuid('recipient_user_id').nullable().references('id').inTable('users').onDelete('SET NULL')
    table.string('sender_name', 80).notNullable().defaultTo('')
    table.string('sender_email', 254).notNullable()
    table.text('message').notNullable()
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now())
    table.index(['recipient_user_id', 'created_at'])
  })
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('contact_messages')
  await knex.schema.dropTableIfExists('audit_logs')
  await knex.schema.dropTableIfExists('refresh_tokens')
  await knex.schema.dropTableIfExists('skills')
  await knex.schema.dropTableIfExists('projects')
  await knex.schema.dropTableIfExists('user_templates')
  await knex.schema.dropTableIfExists('templates')
  await knex.schema.dropTableIfExists('users')
}