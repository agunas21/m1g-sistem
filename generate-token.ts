const { signJwt } = require('./src/lib/crypto');

const token = signJwt({
  sub: "USR-001",
  email: "admin@m1g.org.tr",
  role: "ADMIN",
  name: "Sistem Yöneticisi"
});
console.log(token);
