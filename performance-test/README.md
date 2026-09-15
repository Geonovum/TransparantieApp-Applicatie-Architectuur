# Performance test — Cloudflare Worker

Cloudflare Worker die op *elke* subdomein een response geeft met een delay, plus een testpagina
(`public/index.html`) die honderden parallelle requests naar aparte hostnames stuurt. Elke
request krijgt een eigen hostname (`<n>-<random>-test.domein.nl`).

## 1. Deployen

Vervang in `public/index.html` de domeinnaam `domein.nl` met je eigen test domein. 

```sh
npm install
npx wrangler login
npx wrangler deploy
```

De Worker draait nu op `https://<name>.<subdomein>.workers.dev`. De root URL serveert de `index.html`;
paden zonder bijbehorend asset (zoals `/performance-test`) gaan naar de Cloudflare Worker.

## 2. Cloudflare DNS configureren

Configureer Cloudflare als nameserver. De procedure verschilt per hosting provider. 

Configureer daarna de DNS settings in Cloudflare:

![Menu DNS](/assets/dns-menu.png)

![CNAME configuren DNS](/assets/dns-cname.png)

Configureer daarna de Worker Routes in Cloudflare:

![Menu Worker Routes](/assets/worker-routes-menu.png)

![Menu Worker](/assets/worker-routes.png)

## 3. Controleren

```sh
curl "https://1-1234-test.domein.nl/performance-test?delay=200"
```

Verwacht: `{"ok":true,"subdomain":"1-1234-test","delay":200,"timestamp":...}`

Certificaten hoef je niet te regelen: Universal SSL dekt de apex en alle **eerste-niveau**
subdomeinen, en `1-1234-test.example.com` is er daar één van. Een extra niveau
(`1234.test.example.com`) valt erbuiten en vraagt Total TLS of Advanced Certificate Manager.
