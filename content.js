function calculateTotalPossiblePoints(row) {
  const totalCells = row.querySelectorAll('td').length;
  const numberOfGames = totalCells - 3; // Subtract 3 for non-game cells

  let totalPoints = 0;
  for (let i = 0; i < numberOfGames; i++) {
    if (i < 16) {
      totalPoints += 16 - i;
    } else {
      totalPoints += 1;
    }
  }
  
  return totalPoints;
}

function calculateMaxPoints(row, totalPossiblePoints) {
  const picks = row.querySelectorAll('td:nth-child(n+4)');
  
  // To calculate max points, subtract known losses from total possible points
  let maxPoints = totalPossiblePoints;
  let skippedPickCount = 0;

  picks.forEach(pick => {
    // If a cell has a single span with "-" it's a skipped pick and known loss for 1, then 2, 3, etc.
    const spans = pick.querySelectorAll('span');
    if (spans.length === 1 && spans[0].textContent.trim() === '-') {
      skippedPickCount++;
      maxPoints -= skippedPickCount;
    } else {
      // If a cell has a svg with a class of MuiSvgIcon-colorError it's a known loss for the parsed amount
      const svg = pick.querySelector('svg');
      if (svg && svg.classList.contains('MuiSvgIcon-colorError')) {
        // This is a known loss, parse and subtract points
        const pointsText = spans[1].textContent.trim();
        const points = parseInt(pointsText.replace(/[()]/g, ''), 10) || 0;
        maxPoints -= points;
      }
    }
  });

  return maxPoints;
}

function addMaxPointsColumn() {
  const table = document.querySelector('[aria-label="Weekly Standings"]');
  if (!table) {
    return;
  }
  
  // Find the YTD header
  const headerRow = table.querySelector('thead tr');
  if (!headerRow) return;
  
  const ytdText = Array.from(headerRow.querySelectorAll("p")).find(p => p.textContent.toLowerCase() === 'ytd');
  if (!ytdText || ytdText.textContent.toLowerCase() !== 'ytd') {
    return;
  }

  const ytdHeader = ytdText.closest('th');
  if (!ytdHeader) {
    return;
  }

  // Clone YTD header and modify for MAX
  const maxPointsHeader = ytdHeader.cloneNode(true);
  maxPointsHeader.querySelector('p').textContent = 'MAX';
  
  // Insert MAX header after YTD header
  ytdHeader.insertAdjacentElement('afterend', maxPointsHeader);
  
  // Add data to each row
  const rows = table.querySelectorAll('tbody tr');
  const totalPossiblePoints = calculateTotalPossiblePoints(rows[0]);
  rows.forEach(row => {
    const cells = row.querySelectorAll('td');
    const ytdCell = cells[2]; // The 3rd cell (index 2)
    const maxPoints = calculateMaxPoints(row, totalPossiblePoints);
    const maxPointsCell = ytdCell.cloneNode(true); // Clone with children
    maxPointsCell.textContent = maxPoints;
    maxPointsCell.classList.add('max-points'); // Add the max-points class
    
    // Insert the new cell after the YTD cell
    ytdCell.insertAdjacentElement('afterend', maxPointsCell);
    return;
  });
  
  // Add sorting functionality
  let isDescending = true; // Start with descending order

  function sortRows() {
    const tbody = table.querySelector('tbody');
    const rows = Array.from(tbody.querySelectorAll('tr'));
    
    rows.sort((a, b) => {
      const aMaxPoints = parseInt(a.querySelector('.max-points').textContent);
      const bMaxPoints = parseInt(b.querySelector('.max-points').textContent);
      return isDescending ? bMaxPoints - aMaxPoints : aMaxPoints - bMaxPoints;
    });
    
    rows.forEach(row => tbody.appendChild(row));
  }

  maxPointsHeader.addEventListener('click', () => {
    isDescending = !isDescending; // Toggle sort direction
    sortRows();
  });

  // Initial sort
  sortRows();
}

function waitForTable() {
  const observer = new MutationObserver((mutations, obs) => {
    const table = document.querySelector('[aria-label="Weekly Standings"]');
    if (table) {
      addMaxPointsColumn();
      obs.disconnect();
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

// Run the function when the page loads
window.addEventListener('load', waitForTable);

// Also run the function when navigating between pages (for single-page applications)
let lastUrl = location.href; 
new MutationObserver(() => {
  const url = location.href;
  if (url !== lastUrl) {
    lastUrl = url;
    waitForTable();
  }
}).observe(document, {subtree: true, childList: true});