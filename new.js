const password = "harshal@123";
const hash = await bcrypt.hash(password, 10);
