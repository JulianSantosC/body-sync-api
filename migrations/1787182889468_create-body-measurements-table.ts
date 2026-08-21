import type { ColumnDefinitions, MigrationBuilder } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
    pgm.createTable('body_measurements', {
        id: 'bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY',
        public_id: { type: 'uuid', notNull: true, unique: true },
        user_id: {
            type: 'bigint',
            notNull: true,
            references: 'users',
            onDelete: 'CASCADE',
        },
        entry_date: { type: 'date', notNull: true },
        
        // valores nulos permitidos, para que el usuario pueda llenar cualquier campo,
        // que llene, por lo menos, uno, se valida en lógica
        arm_cm: { type: 'decimal(5,2)'},
        waist_cm: { type: 'decimal(5,2)'},
        hip_cm: { type: 'decimal(5,2)'},
        chest_cm: { type: 'decimal(5,2)'},
        thigh_cm: { type: 'decimal(5,2)'},

        created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
        updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    });

    pgm.addConstraint('body_measurements', 'body_measurements_user_date_unique', {
        unique: ['user_id', 'entry_date'],
    });

    // Permitir solo valores > 0 (como medida adicional de seguridad)
    pgm.addConstraint('body_measurements', 'body_measurements_arm_cm_positive', {
        check: 'arm_cm IS NULL OR arm_cm > 0',
    });
    pgm.addConstraint('body_measurements', 'body_measurements_waist_cm_positive', {
        check: 'waist_cm IS NULL OR waist_cm > 0',
    });
    pgm.addConstraint('body_measurements', 'body_measurements_hip_cm_positive', {
        check: 'hip_cm IS NULL OR hip_cm > 0',
    });
    pgm.addConstraint('body_measurements', 'body_measurements_chest_cm_positive', {
        check: 'chest_cm IS NULL OR chest_cm > 0',
    });
    pgm.addConstraint('body_measurements', 'body_measurements_thigh_cm_positive', {
        check: 'thigh_cm IS NULL OR thigh_cm > 0',
    });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
    pgm.dropTable('body_measurements');
}
