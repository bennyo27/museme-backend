exports.up = function(knex, Promise) {
  return knex.schema.createTable("posts", tbl => {
    tbl.increments().unique();
    tbl
      .string("user_spotify_id")
      .references("spotify_id")
      .inTable("users")
      .notNullable();
    tbl.string("content").notNullable();
    tbl.timestamp("created_at", 6);
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTableIfExists("posts");
};
