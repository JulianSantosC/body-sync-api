import type { ColumnDefinitions, MigrationBuilder } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
    pgm.createTable('refresh_tokens', {
        id: 'bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY',
        user_id: {
            type: 'bigint',
            notNull: true,
            references: 'users',
            onDelete: 'CASCADE'
        },

        // Store token hash instead of raw text
        token_hash: {type: 'VARCHAR(255)', notNull: true, unique: true},
        expires_at: {type: 'timestamptz', notNull: true},

        created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
        // Keep temporaly for security detection (useful for detecting token theft).
        revoked_at: { type: 'timestamptz'},
    });

    // Add index for user_id. Due to this table could have many rows to optimize querys in future.
    pgm.createIndex('refresh_tokens', 'user_id');
}

export async function down(pgm: MigrationBuilder): Promise<void> {
    pgm.dropTable('refresh_tokens');
}
