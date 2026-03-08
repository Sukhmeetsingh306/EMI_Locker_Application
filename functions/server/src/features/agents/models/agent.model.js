const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const agentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  
  email: { type: String, unique: true, sparse: true },
  mobile: { type: String, unique: true, sparse: true },
  
  password: { type: String, required: true },
  
  // Status: 1 = active, 0 = blocked
  status: { type: Number, enum: [0, 1], default: 1 },
  
  // Created by superadmin
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Hash password on create or save
agentSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});

// Hash password on update (findOneAndUpdate)
agentSchema.pre("findOneAndUpdate", async function () {
  const update = this.getUpdate();
  
  if (update.password) {
    const hashedPassword = await bcrypt.hash(update.password, 10);
    this.setUpdate({ ...update, password: hashedPassword });
  }
});

// Compare password
agentSchema.methods.isPasswordMatch = function (pwd) {
  return bcrypt.compare(pwd, this.password);
};

// Remove sensitive info
agentSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model("Agent", agentSchema);

