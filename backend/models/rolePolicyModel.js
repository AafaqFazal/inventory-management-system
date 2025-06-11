const mongoose = require("mongoose");
const { Schema } = mongoose;

const rolePolicySchema = new Schema({
  Icon: { type: String, required: true },
  URL: { type: String, required: true },
  URL_Name: { type: String, required: true },
  isActive: { type: Boolean, default: true },
  order: { type: Number, required: true },
  roleId: { type: String, required: true },
  rolePolicyId: { type: String, required: true, unique: true },
  mode: { type: String },
});

module.exports = mongoose.model("RolePolicy", rolePolicySchema);
