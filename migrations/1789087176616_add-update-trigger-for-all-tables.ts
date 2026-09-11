import type { ColumnDefinitions, MigrationBuilder } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
    // Reusable trigger function shared across every table that has an
    // updated_at column. Centralizing this in Postgres guarantees the
    // invariant holds no matter how a row is modified. The application
    // no longer needs to set updated_at itself.
    pgm.createFunction(
        'set_updated_at', // Function name
        [], // entry parameters
        {
            // It says this function won't return standard SQL data types,
            // but it's designed as a trigger function.
            returns: 'trigger',
            language: 'plpgsql', // Language used to write the function body
            replace: true, // Create or replace the function if it already exists
        },
        /* explication of the function body
        `
        BEGIN
            // New represents the row being inserted or updated, to mutate it before
            // the row is written to disk. And '.updated_at' is the column to set
            // to the current timestamp.
            // The RETURN NEW returns the mutated row to Postgres, which will then
            // write it to disk.
            NEW.updated_at = now(); 
            RETURN NEW;
        END;
        `
        */
        `
        BEGIN
            NEW.updated_at = now(); 
            RETURN NEW;
        END;
        `
    );

    const tablesWithUpdatedAt = ['users', 'profiles', 'weight_entries', 'body_measurements', 'skinfold_measurements'];

    for (const table of tablesWithUpdatedAt) {
        // Create a trigger for each table that has an updated_at column.
        // First parameter: the table name
        // Second parameter: the trigger name (unique)
        pgm.createTrigger(table, `trg_${table}_updated_at`, {
            // It runs BEFORE save the row to disk.
            when: 'BEFORE',
            // It's activated only when a UPDATE statement is executed on
            // the table.
            operation: 'UPDATE',
            // It runs for each row being updated, not once per UPDATE
            // statement.
            level: 'ROW',
            // Assign the PL/pgSQL function to be executed when the trigger
            // is activated.
            function: 'set_updated_at',
        });
    }
}

// The down function should do the opposite of the up function (in the
// opposite order)
export async function down(pgm: MigrationBuilder): Promise<void> {
    const tablesWithUpdatedAt = ['users', 'profiles', 'weight_entries', 'body_measurements', 'skinfold_measurements'];

    for (const table of tablesWithUpdatedAt) {
        pgm.dropTrigger(table, `trg_${table}_updated_at`);
    }

    pgm.dropFunction('set_updated_at', []);
}
