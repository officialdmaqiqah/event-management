const formatTitleCase = (text) => {
  if (!text) return text
  const commonAbbreviations = ['DKM', 'MAKT', 'MUI', 'DPR', 'MPR', 'KUA', 'PNS', 'BUMN', 'PT', 'CV', 'SD', 'SMP', 'SMA', 'SMK', 'TK']
  
  return text.replace(/\w\S*/g, (txt) => {
    if (commonAbbreviations.includes(txt.toUpperCase())) return txt.toUpperCase()
    
    const isWordAllUpperCase = txt === txt.toUpperCase() && /[A-Z]/.test(txt)
    if (isWordAllUpperCase) {
      return txt
    }

    return txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase()
  })
}

console.log(formatTitleCase("Deklarasi IPTNI Babel & Upgrading Konsep Thibb Nabawi"))
console.log(formatTitleCase("DEKLARASI IPTNI BABEL & UPGRADING KONSEP THIBB NABAWI"))
console.log(formatTitleCase("deklarasi IPTNI babel"))
