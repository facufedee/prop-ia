const creationTime = "Fri, 20 Dec 2024 10:00:00 GMT"; // Example format from Firebase
const date = new Date(creationTime);
const expirationDate = new Date(date.getTime() + 14 * 24 * 60 * 60 * 1000);
console.log(expirationDate.toLocaleDateString("es-AR"));
