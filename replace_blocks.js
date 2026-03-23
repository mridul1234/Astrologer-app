const fs = require('fs');

function replaceBlocks(filePath) {
    let content = fs.readFileSync(filePath, 'utf-8');
    
    const navRegex = /\{\/\* ─── NAVBAR ─── \*\/\}[\s\S]*?<\/nav>/;
    const footerRegex = /\{\/\* ─── FOOTER ─── \*\/\}[\s\S]*?<\/footer>/;
    
    // Extract and keep imports separate
    const importStr = "import UserHeader from \"@/components/UserHeader\";\nimport UserFooter from \"@/components/UserFooter\";\n";
    
    if(!content.includes('import UserHeader')) {
        let lines = content.split('\n');
        // Find last import
        let lastImportIdx = 0;
        for(let i=0; i<lines.length; i++) {
            if(lines[i].startsWith('import')) lastImportIdx = i;
        }
        lines.splice(lastImportIdx+1, 0, importStr);
        content = lines.join('\n');
    }

    content = content.replace(navRegex, "<UserHeader />");
    content = content.replace(footerRegex, "<UserFooter />");
    
    fs.writeFileSync(filePath, content);
}

replaceBlocks("apps/web/src/app/dashboard/page.tsx");
replaceBlocks("apps/web/src/app/transactions/page.tsx");
replaceBlocks("apps/web/src/app/wallet/page.tsx");
// orders might have a nav too
replaceBlocks("apps/web/src/app/orders/page.tsx");
// kundli too
if (fs.existsSync("apps/web/src/app/kundli/page.tsx")) {
   replaceBlocks("apps/web/src/app/kundli/page.tsx");
}
console.log("Replaced safely");
