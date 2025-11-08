// // // // routes/bracketPdf.js
// // // const express = require('express');
// // // const router = express.Router();
// // // const puppeteer = require('puppeteer');

// // // // Simple sleep helper to replace page.waitForTimeout
// // // const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

// // // let browser;

// // // // Launch a single browser instance
// // // async function getBrowser() {
// // //   if (browser && browser.isConnected()) return browser;
// // //   browser = await puppeteer.launch({
// // //     headless: 'new',
// // //     args: [
// // //       '--no-sandbox',
// // //       '--disable-setuid-sandbox',
// // //       '--disable-dev-shm-usage',
// // //       '--disable-accelerated-2d-canvas',
// // //       '--no-first-run',
// // //       '--no-zygote',
// // //       '--disable-gpu'
// // //     ]
// // //   });
// // //   return browser;
// // // }

// // // function createLogoHtml(logoUrl, position = 'top-center') {
// // //   const pos = {
// // //     'top-center': 'top: 20px; left: 50%; transform: translateX(-50%);',
// // //     'top-left': 'top: 20px; left: 20px;',
// // //     'top-right': 'top: 20px; right: 20px;',
// // //     'center': 'top: 50%; left: 50%; transform: translate(-50%, -50%);'
// // //   };
// // //   if (!logoUrl) return '';
// // //   return `<img src="${logoUrl}" alt="Tournament Logo" 
// // //            class="tournament-logo" 
// // //            style="position:absolute; z-index:1000; ${pos[position] || pos['top-center']};
// // //                   max-width:150px; max-height:100px; background-color:#1E232D;
// // //                   padding:10px; border-radius:8px;" />`;
// // // }

// // // function createFullHtmlDocument(content, { customCSS = '', baseUrl, logoUrl, logoPosition } = {}) {
// // //   const logoHtml = createLogoHtml(logoUrl, logoPosition);
// // //   return `
// // //     <!DOCTYPE html>
// // //     <html lang="en">
// // //     <head>
// // //       <meta charset="UTF-8" />
// // //       <meta name="viewport" content="width=device-width, initial-scale=1.0" />
// // //       ${baseUrl ? `<base href="${baseUrl}">` : ''}
// // //       <title>Tournament Bracket</title>
// // //       <style>
// // //         *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
// // //         html, body { width: 100%; height: 100%; }
// // //         body {
// // //           background-color: #1E232D !important;
// // //           color: #FFFFFF !important;
// // //           font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
// // //           overflow: visible;
// // //           -webkit-print-color-adjust: exact;
// // //           print-color-adjust: exact;
// // //         }
// // //         .bracket-container {
// // //           position: relative;
// // //           width: 100%;
// // //           min-height: 100vh;
// // //         }
// // //         svg, path, line {
// // //           stroke: #374151 !important;
// // //           stroke-width: 2 !important;
// // //           fill: none !important;
// // //         }
// // //         * { page-break-inside: avoid; }
// // //         ${customCSS}
// // //       </style>
// // //     </head>
// // //     <body>
// // //       <div class="bracket-container">
// // //         ${logoHtml}
// // //         ${content}
// // //       </div>
// // //     </body>
// // //     </html>
// // //   `;
// // // }

// // // function generateFilename(tournamentId) {
// // //   const date = new Date().toISOString().split('T')[0];
// // //   return `tournament-bracket-${tournamentId || 'generated'}-${date}.pdf`;
// // // }

// // // router.post('/generate-pdf/:tournamentId/pdf', async (req, res) => {
// // //   const { htmlContent, customCSS, logoUrl, logoPosition, viewportWidth, viewportHeight, baseUrl } = req.body;
// // //   const { tournamentId } = req.params;

// // //   if (!htmlContent || !htmlContent.trim().startsWith('<')) {
// // //     return res.status(400).json({ error: 'Invalid or missing htmlContent' });
// // //   }

// // //   let page;
// // //   try {
// // //     const browser = await getBrowser();
// // //     page = await browser.newPage();

// // //     await page.setViewport({
// // //       width: viewportWidth || 1920,
// // //       height: viewportHeight || 1080,
// // //       deviceScaleFactor: 2
// // //     });

// // //     const fullHtml = createFullHtmlDocument(htmlContent, {
// // //       customCSS,
// // //       baseUrl,
// // //       logoUrl,
// // //       logoPosition
// // //     });

// // //     await page.setContent(fullHtml, { waitUntil: ['domcontentloaded', 'networkidle0'], timeout: 60000 });
// // //     await page.emulateMediaType('screen');

// // //     // Wait for all images/fonts to load
// // //     await page.evaluate(async () => {
// // //       if (document.fonts && document.fonts.ready) { try { await document.fonts.ready; } catch {} }
// // //       const imgs = Array.from(document.images);
// // //       await Promise.all(imgs.map(img => img.complete ? Promise.resolve() :
// // //         new Promise(res => {
// // //           img.onload = img.onerror = res;
// // //           setTimeout(res, 5000);
// // //         })
// // //       ));
// // //     });

// // //     // Old code: await page.waitForTimeout(500);
// // //     await sleep(500); // ✅ now works on all Puppeteer versions

// // //     // Measure content size
// // //     const dimensions = await page.evaluate(() => {
// // //       const body = document.body, html = document.documentElement;
// // //       return {
// // //         width: Math.max(body.scrollWidth, body.offsetWidth, html.clientWidth, html.scrollWidth, html.offsetWidth),
// // //         height: Math.max(body.scrollHeight, body.offsetHeight, html.clientHeight, html.scrollHeight, html.offsetHeight)
// // //       };
// // //     });

// // //     const pdfBuffer = await page.pdf({
// // //       width: `${dimensions.width}px`,
// // //       height: `${dimensions.height}px`,
// // //       printBackground: true,
// // //       margin: { top: '0px', right: '0px', bottom: '0px', left: '0px' }
// // //     });

// // //     res.setHeader('Content-Type', 'application/pdf');
// // //     res.setHeader('Content-Disposition', `attachment; filename="${generateFilename(tournamentId)}"`);
// // //     res.send(pdfBuffer);

// // //   } catch (err) {
// // //     console.error('PDF generation error:', err);
// // //     res.status(500).json({ error: 'Failed to generate PDF', details: err.message });
// // //   } finally {
// // //     if (page) await page.close();
// // //   }
// // // });

// // // module.exports = router;



// // const express = require('express');
// // const router = express.Router();
// // const puppeteer = require('puppeteer');

// // // Cross-version sleep (replaces page.waitForTimeout)
// // const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// // let browser;

// // // Reuse a single browser for performance
// // async function getBrowser() {
// //   if (browser && browser.isConnected()) return browser;
// //   browser = await puppeteer.launch({
// //     headless: 'new',
// //     args: [
// //       '--no-sandbox',
// //       '--disable-setuid-sandbox',
// //       '--disable-dev-shm-usage',
// //       '--disable-accelerated-2d-canvas',
// //       '--no-first-run',
// //       '--no-zygote',
// //       '--disable-gpu'
// //     ]
// //   });
// //   return browser;
// // }

// // function createLogoHtml(logoUrl, position = 'top-center') {
// //   const pos = {
// //     'top-center': 'top: 20px; left: 50%; transform: translateX(-50%);',
// //     'top-left': 'top: 20px; left: 20px;',
// //     'top-right': 'top: 20px; right: 20px;',
// //     center: 'top: 50%; left: 50%; transform: translate(-50%, -50%);'
// //   };
// //   if (!logoUrl) return '';
// //   return `
// //     <img
// //       src="${logoUrl}"
// //       alt="Tournament Logo"
// //       class="tournament-logo"
// //       style="position:absolute; z-index:1000; ${pos[position] || pos['top-center']};
// //              max-width:150px; max-height:100px; background-color:#1E232D;
// //              padding:10px; border-radius:8px;"
// //     />
// //   `;
// // }

// // function createFullHtmlDocument(
// //   content,
// //   { customCSS = '', baseUrl, logoUrl, logoPosition } = {}
// // ) {
// //   const logoHtml = createLogoHtml(logoUrl, logoPosition);
// //   return `
// //     <!DOCTYPE html>
// //     <html lang="en">
// //     <head>
// //       <meta charset="UTF-8"/>
// //       <meta name="viewport" content="width=device-width, initial-scale=1"/>
// //       ${baseUrl ? `<base href="${baseUrl}">` : ''}
// //       <title>Tournament Bracket</title>
// //       <style>
// //         *,*::before,*::after { box-sizing:border-box; margin:0; padding:0; }
// //         html,body { width:100%; height:100%; }
// //         body {
// //           background-color:#1E232D !important;
// //           color:#FFFFFF !important;
// //           font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
// //           overflow:visible;
// //           -webkit-print-color-adjust:exact;
// //           print-color-adjust:exact;
// //           position:relative;
// //         }
// //         .bracket-container { position:relative; width:100%; min-height:100vh; overflow:visible; }

// //         /* Preserve SVG lines */
// //         svg, path, line { stroke:#374151 !important; stroke-width:2 !important; fill:none !important; opacity:1 !important; }

// //         /* Avoid page breaks inside */
// //         * { page-break-inside: avoid; }

// //         ${customCSS || ''}
// //       </style>
// //     </head>
// //     <body>
// //       <div class="bracket-container">
// //         ${logoHtml}
// //         ${content}
// //       </div>
// //     </body>
// //     </html>
// //   `;
// // }

// // function generateFilename(tournamentId) {
// //   const d = new Date().toISOString().split('T')[0];
// //   return `tournament-bracket-${tournamentId || 'generated'}-${d}.pdf`;
// // }

// // router.post('/generate-pdf/:tournamentId/pdf', async (req, res) => {
// //   const {
// //     htmlContent,          // REQUIRED: full outerHTML of bracket
// //     customCSS,            // OPTIONAL
// //     logoUrl,              // OPTIONAL
// //     logoPosition = 'top-center',
// //     viewportWidth = 1920,
// //     viewportHeight = 1080,
// //     baseUrl               // OPTIONAL: e.g., https://app.example.com
// //   } = req.body || {};

// //   const { tournamentId } = req.params;

// //   if (!htmlContent || typeof htmlContent !== 'string' || !htmlContent.trim().startsWith('<')) {
// //     return res.status(400).json({ error: 'htmlContent must be a valid HTML snippet (outerHTML of the bracket root).' });
// //   }

// //   let page;
// //   try {
// //     const browser = await getBrowser();
// //     page = await browser.newPage();

// //     await page.setViewport({
// //       width: Math.floor(viewportWidth),
// //       height: Math.floor(viewportHeight),
// //       deviceScaleFactor: 2
// //     });

// //     const fullHtml = createFullHtmlDocument(htmlContent, {
// //       customCSS,
// //       baseUrl,
// //       logoUrl,
// //       logoPosition
// //     });

// //     // Load content and wait for resources
// //     await page.setContent(fullHtml, {
// //       waitUntil: ['domcontentloaded', 'networkidle0'],
// //       timeout: 60000
// //     });

// //     await page.emulateMediaType('screen');

// //     // Ensure fonts & images loaded
// //     await page.evaluate(async () => {
// //       if (document.fonts && document.fonts.ready) {
// //         try { await document.fonts.ready; } catch (e) {}
// //       }
// //       const images = Array.from(document.images);
// //       await Promise.all(images.map(img => {
// //         if (img.complete) return Promise.resolve();
// //         return new Promise(resolve => {
// //           img.addEventListener('load', resolve, { once: true });
// //           img.addEventListener('error', resolve, { once: true });
// //           setTimeout(resolve, 5000);
// //         });
// //       }));
// //     });

// //     // Allow any microtasks/animations to settle
// //     await sleep(300);

// //     // Measure full content dimensions
// //     const dimensions = await page.evaluate(() => {
// //       const body = document.body;
// //       const html = document.documentElement;
// //       const width = Math.max(
// //         body.scrollWidth, body.offsetWidth,
// //         html.clientWidth, html.scrollWidth, html.offsetWidth
// //       );
// //       const height = Math.max(
// //         body.scrollHeight, body.offsetHeight,
// //         html.clientHeight, html.scrollHeight, html.offsetHeight
// //       );
// //       return { width, height };
// //     });

// //     const pdfBuffer = await page.pdf({
// //       width: `${dimensions.width}px`,
// //       height: `${dimensions.height}px`,
// //       printBackground: true,
// //       preferCSSPageSize: false,
// //       displayHeaderFooter: false,
// //       margin: { top: '0px', right: '0px', bottom: '0px', left: '0px' },
// //       timeout: 0
// //     });

// //     if (!pdfBuffer || pdfBuffer.length === 0) {
// //       return res.status(500).json({ error: 'Generated PDF buffer is empty' });
// //     }

// //     const filename = generateFilename(tournamentId);

// //     // Critical headers for valid PDF delivery
// //     res.setHeader('Content-Type', 'application/pdf');
// //     res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
// //     res.setHeader('Content-Length', Buffer.byteLength(pdfBuffer));
// //     res.setHeader('Accept-Ranges', 'bytes');
// //     res.setHeader('Cache-Control', 'public, must-revalidate, max-age=0');
// //     res.setHeader('Expires', '0');

// //     // Send raw bytes
// //     res.end(pdfBuffer);
// //   } catch (err) {
// //     console.error('PDF generation error:', err);
// //     res.status(500).json({ error: 'Failed to generate PDF', details: err?.message || String(err) });
// //   } finally {
// //     if (page) {
// //       try { await page.close(); } catch {}
// //     }
// //   }
// // });

// // module.exports = router;


// const express = require('express');
// const puppeteer = require('puppeteer');
// const router = express.Router();

// const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// let browser;
// async function getBrowser() {
//   if (browser && browser.isConnected()) return browser;
//   browser = await puppeteer.launch({
//     headless: 'new',
//     args: [
//       '--no-sandbox',
//       '--disable-setuid-sandbox',
//       '--disable-dev-shm-usage',
//       '--no-first-run',
//       '--no-zygote',
//       '--disable-gpu'
//     ]
//   });
//   return browser;
// }

// function createLogoHtml(url, pos = 'top-center') {
//   if (!url) return '';
//   const p = {
//     'top-center': 'top:20px;left:50%;transform:translateX(-50%);',
//     'top-left': 'top:20px;left:20px;',
//     'top-right': 'top:20px;right:20px;',
//     'center': 'top:50%;left:50%;transform:translate(-50%,-50%);'
//   };
//   return `<img src="${url}" alt="Tournament Logo" class="tournament-logo"
//     style="position:absolute;z-index:1000;${p[pos]||p['top-center']};
//     max-width:150px;max-height:100px;background-color:#1E232D;padding:10px;border-radius:8px;" />`;
// }

// function buildHtml(snippet, { customCSS = '', baseUrl, logoUrl, logoPosition } = {}) {
//   return `<!doctype html>
// <html lang="en">
// <head>
// <meta charset="utf-8"/>
// <meta name="viewport" content="width=device-width,initial-scale=1"/>
// ${baseUrl ? `<base href="${baseUrl}">` : ''}
// <style>
//   *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
//   html,body{width:100%;height:100%}
//   body{
//     background:#1E232D !important; color:#fff !important;
//     font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
//     -webkit-print-color-adjust:exact; print-color-adjust:exact; overflow:visible;
//   }
//   .bracket-container{position:relative;width:100%;min-height:100vh;overflow:visible}
//   /* Preserve lines/connectors */
//   svg,path,line{stroke:#374151 !important; stroke-width:2 !important; fill:none !important; opacity:1 !important}
//   *{page-break-inside:avoid}
//   ${customCSS||''}
// </style>
// </head>
// <body>
//   <div class="bracket-container">
//     ${createLogoHtml(logoUrl, logoPosition)}
//     ${snippet}
//   </div>
// </body>
// </html>`;
// }

// function filename(tid){
//   const d = new Date().toISOString().split('T')[0];
//   return `tournament-bracket-${tid||'generated'}-${d}.pdf`;
// }

// router.post('/generate-pdf/:tournamentId/pdf', async (req, res) => {
//   const { tournamentId } = req.params;
//   const {
//     htmlContent, customCSS, logoUrl, logoPosition = 'top-center',
//     viewportWidth = 1920, viewportHeight = 1080, baseUrl,
//     cssUrls = [], // optional: array of absolute CSS URLs to inject
//     scriptUrls = [] // optional: array of absolute JS URLs if your bracket needs them
//   } = req.body || {};

//   if (!htmlContent || !htmlContent.trim().startsWith('<')) {
//     return res.status(400).json({ error: 'htmlContent must be a valid HTML snippet (outerHTML of bracket root).' });
//   }

//   let page;
//   try {
//     const br = await getBrowser();
//     page = await br.newPage();

//     await page.setViewport({ width: Math.floor(viewportWidth), height: Math.floor(viewportHeight), deviceScaleFactor: 2 });

//     // Build HTML and set content
//     const fullHtml = buildHtml(htmlContent, { customCSS, baseUrl, logoUrl, logoPosition });
//     await page.setContent(fullHtml, { waitUntil: ['domcontentloaded','networkidle0'], timeout: 60000 }); // wait for CSS/links to resolve[9]

//     // Optionally inject extra CSS/JS (absolute URLs) if Tailwind/app CSS isn’t included by the snippet
//     for (const href of cssUrls) { await page.addStyleTag({ url: href }).catch(()=>{}); } // load external CSS[12]
//     for (const src of scriptUrls) { await page.addScriptTag({ url: src }).catch(()=>{}); } // if needed for layout[12]

//     // Match on-screen styles and print backgrounds
//     await page.emulateMediaType('screen'); // use screen CSS, not print[11][17]
    
//     // Ensure web fonts are fully loaded before measuring
//     await page.evaluateHandle('document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()'); // wait for fonts[3][6]

//     // Also wait images to finish
//     await page.evaluate(async () => {
//       const imgs = Array.from(document.images);
//       await Promise.all(imgs.map(img => img.complete ? Promise.resolve() :
//         new Promise(r => { img.addEventListener('load', r, {once:true}); img.addEventListener('error', r, {once:true}); setTimeout(r, 5000); })
//       ));
//     });

//     // Small settle
//     await sleep(200);

//     // Measure
//     const size = await page.evaluate(() => {
//       const b = document.body, h = document.documentElement;
//       return {
//         width: Math.max(b.scrollWidth, b.offsetWidth, h.clientWidth, h.scrollWidth, h.offsetWidth),
//         height: Math.max(b.scrollHeight, b.offsetHeight, h.clientHeight, h.scrollHeight, h.offsetHeight)
//       };
//     });

//     const pdf = await page.pdf({
//       width: `${size.width}px`,
//       height: `${size.height}px`,
//       printBackground: true, // keep backgrounds[8][14]
//       preferCSSPageSize: false,
//       margin: { top:'0px', right:'0px', bottom:'0px', left:'0px' }
//     });

//     if (!pdf?.length) return res.status(500).json({ error: 'Empty PDF buffer' });

//     const name = filename(tournamentId);
//     res.setHeader('Content-Type', 'application/pdf');
//     res.setHeader('Content-Disposition', `attachment; filename="${name}"`);
//     res.setHeader('Content-Length', Buffer.byteLength(pdf));
//     res.setHeader('Accept-Ranges', 'bytes');
//     res.setHeader('Cache-Control', 'public, must-revalidate, max-age=0');
//     res.setHeader('Expires', '0');
//     res.end(pdf);
//   } catch (e) {
//     console.error('PDF error:', e);
//     res.status(500).json({ error: 'Failed to generate PDF', details: e?.message || String(e) });
//   } finally {
//     if (page) try { await page.close(); } catch {}
//   }
// });

// module.exports = router;



const express = require("express");
const puppeteer = require("puppeteer");
const router = express.Router();
const bodyParser = require("body-parser");
const path = require("path");
const fs = require("fs");

// const app = express();
// app.use(bodyParser.json({ limit: "50mb" }));

// Utility: create an HTML file for Puppeteer to load
// const router = router();

function buildFullHTML({ htmlContent, cssUrls, customCSS, baseUrl }) {
  const cssLinks = (cssUrls || [])
    .map((url) => `<link rel="stylesheet" href="${url}">`)
    .join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
${cssLinks}
<style>
  body {
    margin: 0;
    background: #1E232D;
  }
  ${customCSS || ""}
</style>
</head>
<body>
${htmlContent}
</body>
</html>`;
}

router.post("/generate-pdf/:tournamentId/pdf", async (req, res) => {
  try {
    const { htmlContent, cssUrls, customCSS, baseUrl, viewportWidth, viewportHeight } = req.body;
    const { tournamentId } = req.params;

    if (!htmlContent) {
      return res.status(400).json({ error: "Missing htmlContent" });
    }

    // Build the full HTML doc
    const fullHtml = buildFullHTML({
      htmlContent,
      cssUrls,
      customCSS,
      baseUrl
    });

    // Launch Puppeteer
    const browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"]
    });

    const page = await browser.newPage();

    // Set large viewport to capture big bracket without scaling down
    await page.setViewport({
      width: viewportWidth || 1920,
      height: viewportHeight || 1080,
      deviceScaleFactor: 2
    });

    // Load HTML into Puppeteer
    await page.setContent(fullHtml, { waitUntil: "networkidle0" });

    // --- Measure content size ---
    const { fullWidth, fullHeight } = await page.evaluate(() => {
      const body = document.body;
      const html = document.documentElement;
      const width = Math.max(
        body.scrollWidth,
        html.scrollWidth,
        body.offsetWidth,
        html.offsetWidth,
        body.clientWidth,
        html.clientWidth
      );
      const height = Math.max(
        body.scrollHeight,
        html.scrollHeight,
        body.offsetHeight,
        html.offsetHeight,
        body.clientHeight,
        html.clientHeight
      );
      return { fullWidth: width, fullHeight: height };
    });

    console.log(`Bracket size: ${fullWidth}x${fullHeight}`);

    // Puppeteer default PDF limit ~16,383px — so split into tiles if too big
    const maxDimension = 14000; // safe margin
    const horizontalPages = Math.ceil(fullWidth / maxDimension);
    const verticalPages = Math.ceil(fullHeight / maxDimension);

    console.log(`Pages: ${horizontalPages} x ${verticalPages}`);

    // Generate PDFs for each tile and merge later
    const buffers = [];

    for (let y = 0; y < verticalPages; y++) {
      for (let x = 0; x < horizontalPages; x++) {
        const clip = {
          x: x * maxDimension,
          y: y * maxDimension,
          width: Math.min(maxDimension, fullWidth - x * maxDimension),
          height: Math.min(maxDimension, fullHeight - y * maxDimension)
        };

        const pdfBuffer = await page.pdf({
          printBackground: true,
          clip,
          width: `${clip.width}px`,
          height: `${clip.height}px`,
          pageRanges: "1"
        });

        buffers.push(pdfBuffer);
      }
    }

    await browser.close();

    // Merge PDFs side-by-side in correct order
    // For extreme accuracy, you could use `pdf-lib` or `HummusJS` to stitch tiles together into one large PDF canvas
    // but here we send as zipped multi-page PDF for easier scrolling
    const merged = Buffer.concat(buffers);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="tournament-bracket-${tournamentId}.pdf"`);
    res.send(merged);
  } catch (err) {
    console.error("PDF generation error:", err);
    res.status(500).json({ error: "Failed to generate PDF" });
  }
});

// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => console.log(`PDF server running on port ${PORT}`));4


module.exports = router;
