RSW Kassa webapp.

Dit is een werkende starter die direct draait met Docker Compose.

Wat je krijgt.

Login.
Meerdere kassa's tegelijk.
Afrekenpagina met tabel.
Responsive tegels voor consumpties.
Barcode scanner input via toetsenbord en Enter.
MySQL database met Prisma schema.
Seed met standaard users, kassa's en producten.

Snel starten.

1. Ga naar de map rsw-webapp.
2. Start.

docker compose up -d --build

3. Open.

http://<server-ip>/

Standaard gebruikers.

admin / admin123
kassa / kassa123

Database.

MySQL draait in container rsw_db.

Poorten.

80 via nginx.
3000 direct naar app.
3306 direct naar MySQL.

Producten aanpassen.

Je kunt producten later beheren via eigen schermen.
Voor nu staan ze in de seed.

Afbeeldingen.

Er staan simpele SVG afbeeldingen in app/public/images.
Je kunt die later vervangen.

Belangrijk voor productie.

Wijzig NEXTAUTH_SECRET.
Wijzig database wachtwoorden.
Zet HTTPS aan in nginx.
