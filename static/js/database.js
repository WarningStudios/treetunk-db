// Supabase initialisieren
const client = supabase.createClient(
      'https://pjvtmezsftuhtseznhhd.supabase.co', // deine Supabase-URL
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqdnRtZXpzZnR1aHRzZXpuaGhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyNzM0ODYsImV4cCI6MjA3NTg0OTQ4Nn0.OnPVKCy0_Ojdnuf6AuWb_Rsd_G935ZvJ1eqom2mFk_M'          // dein anon key
);

    // Daten abrufen
async function ladeBilder() {
      const container = document.getElementById('bilder');
        container.innerHTML = '<p>Lade Bilder...</p>';
      const { data, error } = await client  
        .from('images') // Tabellenname
        .select('*');

      if (error) {
        console.error('Fehler beim Laden:', error);
        return;
      }
      
        container.innerHTML = ''; // vorherige Inhalte löschen

  data.forEach(bild => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <img class="element" src="data:image/png;base64,${bild.image}" alt="Bild" />
    `;
    card.addEventListener('click', () => {
  document.querySelectorAll('.database .card')
    .forEach(c => { c.style.backgroundColor = '#fff'; c.style.border = 'none'; });
  card.style.backgroundColor = '#e0f7fa';
  card.style.border = '2px solid #007BFF';

  // Editor anzeigen
  document.getElementById('editor').style.display = 'block';
  document.getElementById('editorImage').src = `data:image/png;base64,${bild.image}`;
  document.getElementById('editorMeta').value = bild.meta || '';
  
  // Speichern
  document.getElementById('saveBtn').onclick = async () => {
    const newMeta = document.getElementById('editorMeta').value;
    const { error } = await client
      .from('images')
      .update({ meta: newMeta })
      .eq('id', bild.id);
    if (error) {
      alert('Fehler beim Speichern');
      console.error(error);
    } else {
      ladeBilder();
      document.getElementById('editor').style.display = 'none';
    }
  };

  // Löschen
  document.getElementById('deleteBtn').onclick = async () => {
    if (!confirm('Bild wirklich löschen?')) return;
    const { error } = await client
      .from('images')
      .delete()
      .eq('id', bild.id);
    if (error) {
      alert('Fehler beim Löschen');
      console.error(error);
    } else {
      ladeBilder();
      document.getElementById('editor').style.display = 'none';
    }
  };
});

    container.appendChild(card);
  })}

    ladeBilder();



document.getElementById('uploadForm').onsubmit = async (e) => {
  e.preventDefault();

  const fileInput = document.getElementById('bildDatei');
  const metaData = {globalPosition: leseKoordinatenAlsJSON()};

  const file = fileInput.files[0];

  if (!file) return alert('Bitte ein Bild auswählen.');

  // Datei in Base64 konvertieren
  const reader = new FileReader();
  reader.onloadend = async () => {
    const base64String = reader.result.split(',')[1]; // Nur der Base64-Teil

    const { data, error } = await client
      .from('images')
      .insert([
        {
          image: base64String,
          meta: JSON.stringify(metaData)
        }
      ]);

    if (error) {
      console.error('Fehler beim Hochladen:', error);
      alert('Upload fehlgeschlagen.');
    } else {
      ladeBilder(); // Galerie aktualisieren
    }
  };

  reader.readAsDataURL(file);
};

function dezimalZuGradMinuten(dezimal, isLat) {
  const abs = Math.abs(dezimal);
  const grad = Math.floor(abs);
  const minuten = Math.round((abs - grad) * 60);
  const richtung = isLat
    ? dezimal >= 0 ? 'N' : 'S'
    : dezimal >= 0 ? 'E' : 'W';
  return { grad, minuten, richtung };
}
function gradMinutenZuDezimal(grad, minuten, richtung) {
  let dez = parseFloat(grad) + parseFloat(minuten) / 60;
  if (richtung === 'S' || richtung === 'W') dez *= -1;
  return dez;
}


navigator.geolocation.getCurrentPosition(pos => {
  const lat = pos.coords.latitude;
  const lng = pos.coords.longitude;

  const latData = dezimalZuGradMinuten(lat, true);
  const lngData = dezimalZuGradMinuten(lng, false);

  document.getElementById('latDeg').value = latData.grad;
  document.getElementById('latMin').value = latData.minuten;
  document.getElementById('latDir').value = latData.richtung;

  document.getElementById('lngDeg').value = lngData.grad;
  document.getElementById('lngMin').value = lngData.minuten;
  document.getElementById('lngDir').value = lngData.richtung;
});


function leseKoordinatenAlsJSON() {
  const latGrad = document.getElementById('latDeg').value;
  const latMin = document.getElementById('latMin').value;
  const latDir = document.getElementById('latDir').value;

  const lngGrad = document.getElementById('lngDeg').value;
  const lngMin = document.getElementById('lngMin').value;
  const lngDir = document.getElementById('lngDir').value;

  const latitude = gradMinutenZuDezimal(latGrad, latMin, latDir);
  const longitude = gradMinutenZuDezimal(lngGrad, lngMin, lngDir);

  const json = {
    latitude: latitude,
    longitude: longitude,
    original: {
      lat: `${latGrad}° ${latMin}' ${latDir}`,
      lng: `${lngGrad}° ${lngMin}' ${lngDir}`
    }
  };

  console.log('Koordinaten als JSON:', JSON.stringify(json, null, 2));
  return json;
}

