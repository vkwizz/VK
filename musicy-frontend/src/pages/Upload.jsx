import { useState } from 'react';
import { api } from '../lib/api.js';

export default function UploadPage() {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('');

  async function getSignature() {
    const { data } = await api.get('/api/cloudinary-sign');
    return data;
  }

  async function onUpload(e) {
    e.preventDefault();
    if (!file) return;
    setStatus('Requesting signature...');
    const { timestamp, signature, apiKey, cloudName } = await getSignature();

    setStatus('Uploading to Cloudinary...');
    const form = new FormData();
    form.append('file', file);
    form.append('timestamp', String(timestamp));
    form.append('api_key', apiKey);
    form.append('signature', signature);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
      method: 'POST',
      body: form,
    });
    const json = await res.json();
    if (json.secure_url) setStatus('Uploaded: ' + json.secure_url);
    else setStatus('Upload failed');
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold mb-4">Upload your track</h1>
      <form onSubmit={onUpload} className="space-y-3">
        <input type="file" accept="audio/*,video/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        <div>
          <button className="px-4 py-2 bg-emerald-600 rounded text-white" type="submit">Upload</button>
        </div>
      </form>
      {status && <p className="mt-3 text-sm text-zinc-400">{status}</p>}
    </div>
  );
}


