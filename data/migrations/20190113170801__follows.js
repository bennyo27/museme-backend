exports.up = function(knex, Promise) {
  return knex.schema.createTable("follows", tbl => {
    tbl.increments().unique();
    tbl
      .string("follower")
      .references("display_name")
      .inTable("users")
      .notNullable();
    tbl
      .string("followee")
      .references("display_name")
      .inTable("users")
      .notNullable()
      .unique();
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTableIfExists("follows");
};
