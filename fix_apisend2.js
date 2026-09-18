const fs = require("fs");

const content = fs.readFileSync("C:\\github\\medwork-manager\\medwork-frontend\\src\\components\\CompanyGroupsCenter.jsx", "utf8");

const replacements = [
    { from: "apiSend(`/api/company-groups/${selectedGroupId}/bulk-plan-visits`, 'POST')", to: "apiSend('POST', `/api/company-groups/${selectedGroupId}/bulk-plan-visits`)" },
    { from: "apiSend(`/api/company-groups/${selectedGroupId}/bulk-plan-campaign`, 'POST')", to: "apiSend('POST', `/api/company-groups/${selectedGroupId}/bulk-plan-campaign`)" },
    { from: "apiSend(`/api/company-groups/${selectedGroupId}/bulk-plan-site-visits`, 'POST')", to: "apiSend('POST', `/api/company-groups/${selectedGroupId}/bulk-plan-site-visits`)" },
    { from: "apiSend(`/api/company-groups/${selectedGroupId}/compliance/remediate`, 'POST')", to: "apiSend('POST', `/api/company-groups/${selectedGroupId}/compliance/remediate`)" },
    { from: "apiSend(`/api/company-groups/${selectedGroupId}/propagate-doctors`, 'POST')", to: "apiSend('POST', `/api/company-groups/${selectedGroupId}/propagate-doctors`)" },
    { from: "apiSend(`/api/company-groups/${selectedGroupId}/propagate-protocols`, 'POST')", to: "apiSend('POST', `/api/company-groups/${selectedGroupId}/propagate-protocols`)" },
    { from: "apiSend(`/api/company-groups/${selectedGroupId}/companies`, 'POST')", to: "apiSend('POST', `/api/company-groups/${selectedGroupId}/companies`)" },
    { from: "apiSend(`/api/company-groups/${selectedGroupId}/doctors`, 'POST')", to: "apiSend('POST', `/api/company-groups/${selectedGroupId}/doctors`)" },
];

let newContent = content;
for (const r of replacements) {
    newContent = newContent.split(r.from).join(r.to);
}

fs.writeFileSync("C:\\github\\medwork-manager\\medwork-frontend\\src\\components\\CompanyGroupsCenter.jsx", newContent);
console.log("Done");
