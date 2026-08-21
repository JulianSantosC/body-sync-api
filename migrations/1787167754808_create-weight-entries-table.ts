import type { ColumnDefinitions, MigrationBuilder } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
    pgm.createTable('weight_entries', {
        id: 'bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY',
        public_id: { type: 'uuid', notNull: true, unique: true },
        user_id: {
            type: 'bigint',
            notNull: true,
            references: 'users',
            onDelete: 'CASCADE',
        },
        entry_date: { type: 'date', notNull: true },
        
        weight_kg: { type: 'decimal(5,2)', notNull: true },

        created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
        updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    });

    // UNIQUE compuesto:
    // [EQUIVALENTE EN MySQL: (`UNIQUE KEY (user_id, entry_date)`)],
    // garantiza que un mismo usuario no pueda tener dos entradas de peso el mismo día.
    pgm.addConstraint('weight_entries', 'weight_entries_user_date_unique', {
        unique: ['user_id', 'entry_date'],
    });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
    pgm.dropTable('weight_entries');
}
