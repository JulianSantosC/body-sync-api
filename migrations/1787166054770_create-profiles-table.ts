import type { ColumnDefinitions, MigrationBuilder } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
    pgm.createTable('profiles', {
        user_id: {
            type: 'bigint',
            primaryKey: true,   // Esta tabla usa user_id como PK directamente, no un id propio
            notNull: true,
            references: 'users', // Equivalente a FOREIGN KEY (user_id) REFERENCES users(id) en MySQL.
            onDelete: 'CASCADE', // Igual que ON DELETE CASCADE en MySQL: si se borra el user, se borra registro
        },
        birth_date: { type: 'date' }, // Sin notNull -> permite NULL, para onboarding incompleto.
        height_cm: { type: 'decimal(5,2)' }, // decimal(5,2) 5 dígitos totales: 2 después del punto
        biological_sex: { type: 'varchar(6)' },
        activity_level: { type: 'varchar(20)' },
        updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
        // Sin 'created_at' porque se crea al mismo tiempo que se crea el registro del usuario
    });

    // El CHECK constraints se añade aparte y de esta manera (dejando sl varchar arriba).
    // De esta manera, a futuro se vuelve más fácil su actualización, y la diferencia frente a 
    // un ENUM nativo es poca para el tipo y cantidad de datos.
    // El resultado SQL es equivalente a: ALTER TABLE profiles ADD CONSTRAINT ... CHECK (...)
    pgm.addConstraint('profiles', 'profiles_biological_sex_check', {
        check: "biological_sex IN ('male', 'female')",
    });

    pgm.addConstraint('profiles', 'profiles_activity_level_check', {
        check: "activity_level IN ('sedentary', 'light', 'moderate', 'active', 'very_active')",
    });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
    // Al borrar la tabla 'profiles' también se borran los checks
    pgm.dropTable('profiles');
}
