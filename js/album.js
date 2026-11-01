window.AP = window.AP || {};

// Saved parties, newest first. Each keeps the ants and foods as data, so the
// party can be drawn again later exactly as it was.
AP.album = (() => {
  const MAX = 50; // oldest drop off, to stay well inside localStorage limits

  const list = () => AP.storage.load('album', []);

  // Returns the saved entry, or null if it couldn't be saved.
  function add(round) {
    const entry = {
      id: String(Date.now()),
      date: new Date().toISOString(),
      ants: round.ants,
      foods: round.foods,
      summary: {
        questions: round.ants.length,
        firstTry: round.ants.filter(a => a.firstTry).length,
      },
    };
    return AP.storage.save('album', [entry, ...list()].slice(0, MAX)) ? entry : null;
  }

  const find = id => list().find(e => e.id === id);
  const clear = () => AP.storage.remove('album');

  function formatDate(iso) {
    const d = new Date(iso);
    const day = d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
    const time = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    return `${day}, ${time}`;
  }

  return { list, add, find, clear, formatDate };
})();
