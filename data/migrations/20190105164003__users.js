exports.up = function(knex, Promise) {
  return knex.schema.createTable("users", tbl => {
    tbl.increments().unique(); // id
    tbl
      .string("display_name")
      .notNullable()
      .unique();
    tbl
      .string("email")
      .notNullable()
      .unique();
    tbl
      .string("spotify_id")
      .notNullable()
      .unique();
    tbl.timestamp("created_at", 6);
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTableIfExists("users");
};
