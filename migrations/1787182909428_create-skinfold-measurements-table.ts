import type { ColumnDefinitions, MigrationBuilder } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
    pgm.createTable('skinfold_measurements', {
        id: 'bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY',
        public_id: { type: 'uuid', notNull: true, unique: true },
        user_id: {
            type: 'bigint',
            notNull: true,
            references: 'users',
            onDelete: 'CASCADE',
        },
        entry_date: { type: 'date', notNull: true },

        // valores nulos NO permitidos, todos son necesarios para su uso en la fórmula
        chest_mm: { type: 'decimal(4,1)', notNull: true },
        abdominal_mm: { type: 'decimal(4,1)', notNull: true },
        thigh_mm: { type: 'decimal(4,1)', notNull: true },
        triceps_mm: { type: 'decimal(4,1)', notNull: true },
        suprailiac_mm: { type: 'decimal(4,1)', notNull: true },
        subscapular_mm: { type: 'decimal(4,1)', notNull: true },
        midaxillary_mm: { type: 'decimal(4,1)', notNull: true },

        created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
        updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    });

    pgm.addConstraint('skinfold_measurements', 'skinfold_measurements_user_date_unique', {
        unique: ['user_id', 'entry_date'],
    });

    pgm.addConstraint('skinfold_measurements', 'skinfold_measurements_chest_mm_positive', {
        check: 'chest_mm > 0',
    });
    pgm.addConstraint('skinfold_measurements', 'skinfold_measurements_abdominal_mm_positive', {
        check: 'abdominal_mm > 0',
    });
    pgm.addConstraint('skinfold_measurements', 'skinfold_measurements_thigh_mm_positive', {
        check: 'thigh_mm > 0',
    });
    pgm.addConstraint('skinfold_measurements', 'skinfold_measurements_triceps_mm_positive', {
        check: 'triceps_mm > 0',
    });
    pgm.addConstraint('skinfold_measurements', 'skinfold_measurements_suprailiac_mm_positive', {
        check: 'suprailiac_mm > 0',
    });
    pgm.addConstraint('skinfold_measurements', 'skinfold_measurements_subscapular_mm_positive', {
        check: 'subscapular_mm > 0',
    });
    pgm.addConstraint('skinfold_measurements', 'skinfold_measurements_midaxillary_mm_positive', {
        check: 'midaxillary_mm > 0',
    });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
    pgm.dropTable('skinfold_measurements');
}
