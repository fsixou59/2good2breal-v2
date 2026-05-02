import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { Search, Plus, Trash2, Upload, X, User, MapPin, Calendar, FileText, ChevronLeft, Image, Edit2, Save } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

function getHeaders() {
  return { headers: { Authorization: `Bearer ${localStorage.getItem('admin_token')}` } };
}

export default function ProfileSeekerPage() {
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('list');
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(function() {
    if (!localStorage.getItem('admin_token')) { navigate('/login'); return; }
    loadData();
  }, [navigate]);

  function loadData() {
    axios.get(API + '/seeker/profiles', getHeaders())
      .then(function(r) { setProfiles(r.data); setLoading(false); })
      .catch(function(e) { if (e.response && e.response.status === 401) navigate('/login'); setLoading(false); });
  }

  function doDelete(id) {
    if (!window.confirm('Delete this profile?')) return;
    axios.delete(API + '/seeker/profiles/' + id, getHeaders())
      .then(function() {
        setProfiles(function(p) { return p.filter(function(x) { return x.id !== id; }); });
        if (selected && selected.id === id) { setView('list'); setSelected(null); }
        toast.success('Deleted');
      })
      .catch(function() { toast.error('Delete failed'); });
  }

  var filtered = profiles.filter(function(p) {
    if (!search) return true;
    var q = search.toLowerCase();
    return (p.first_name || '').toLowerCase().indexOf(q) >= 0 ||
      (p.last_name || '').toLowerCase().indexOf(q) >= 0 ||
      (p.address || '').toLowerCase().indexOf(q) >= 0;
  });

  if (loading) return React.createElement('div', { className: 'flex items-center justify-center py-20 text-purple-400' }, 'Loading...');

  if (view === 'new') return React.createElement(NewForm, {
    onDone: function(p) { setProfiles(function(prev) { return [p].concat(prev); }); setSelected(p); setView('detail'); },
    onCancel: function() { setView('list'); }
  });

  if (view === 'detail' && selected) return React.createElement(Detail, {
    profile: selected,
    onBack: function() { setView('list'); setSelected(null); },
    onUpdate: function(u) { setSelected(u); setProfiles(function(prev) { return prev.map(function(p) { return p.id === u.id ? u : p; }); }); }
  });

  return React.createElement('div', { className: 'space-y-6' },
    React.createElement('div', { className: 'flex items-center justify-between' },
      React.createElement('h2', { className: 'text-xl font-bold text-white' }, 'Profile Seeker'),
      React.createElement(Button, { onClick: function() { setView('new'); }, className: 'bg-purple-600 hover:bg-purple-500', 'data-testid': 'new-seeker-profile' },
        React.createElement(Plus, { className: 'w-4 h-4 mr-2' }), ' New Profile'
      )
    ),
    React.createElement('div', { className: 'relative' },
      React.createElement(Search, { className: 'absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500' }),
      React.createElement(Input, { value: search, onChange: function(e) { setSearch(e.target.value); }, placeholder: 'Search profiles...', className: 'pl-10 bg-zinc-900/50 border-zinc-800 text-white' })
    ),
    filtered.length === 0
      ? React.createElement('div', { className: 'text-center py-16 text-zinc-500' },
          React.createElement(Search, { className: 'w-10 h-10 mx-auto mb-3 opacity-50' }),
          React.createElement('p', null, search ? 'No match' : 'No profiles yet'),
          React.createElement(Button, { onClick: function() { setView('new'); }, variant: 'outline', className: 'mt-4 border-zinc-700 text-zinc-300' },
            React.createElement(Plus, { className: 'w-4 h-4 mr-2' }), ' Create First Profile'
          )
        )
      : React.createElement('div', { className: 'space-y-3' },
          filtered.map(function(p) {
            var pc = (p.photos || []).length;
            return React.createElement('div', { key: p.id, className: 'border border-zinc-800 rounded-xl p-4 hover:border-purple-700/50 transition-colors cursor-pointer bg-zinc-900/50', onClick: function() { setSelected(p); setView('detail'); } },
              React.createElement('div', { className: 'flex items-center gap-4' },
                React.createElement('div', { className: 'w-14 h-14 rounded-xl bg-purple-500/20 flex items-center justify-center flex-shrink-0 overflow-hidden' },
                  pc > 0
                    ? React.createElement('img', { src: p.photos[0], alt: '', className: 'w-full h-full object-cover' })
                    : React.createElement(User, { className: 'w-6 h-6 text-purple-400' })
                ),
                React.createElement('div', { className: 'flex-1 min-w-0' },
                  React.createElement('h3', { className: 'text-white font-semibold truncate' }, p.first_name + ' ' + (p.last_name || '')),
                  React.createElement('div', { className: 'flex items-center gap-3 text-zinc-400 text-sm mt-1' },
                    p.address ? React.createElement('span', { className: 'flex items-center gap-1' }, React.createElement(MapPin, { className: 'w-3 h-3' }), p.address) : null,
                    React.createElement('span', { className: 'flex items-center gap-1' }, React.createElement(Image, { className: 'w-3 h-3' }), pc + ' photo' + (pc !== 1 ? 's' : ''))
                  )
                ),
                React.createElement(Button, { variant: 'ghost', size: 'sm', className: 'text-red-400 hover:text-red-300 hover:bg-red-950/50 flex-shrink-0', onClick: function(e) { e.stopPropagation(); doDelete(p.id); } },
                  React.createElement(Trash2, { className: 'w-4 h-4' })
                )
              )
            );
          })
        )
  );
}

function NewForm(props) {
  var formRef = useRef({ first_name: '', last_name: '', address: '', birth_date: '', birth_place: '', notes: '' });
  var photosRef = useRef([]);
  var fileRef = useRef(null);
  var _f = useState(0); var tick = _f[1];
  var _s = useState(false); var saving = _s[0]; var setSaving = _s[1];

  function set(k, v) { formRef.current[k] = v; tick(function(n) { return n + 1; }); }
  function addPhotos(e) {
    var files = Array.from(e.target.files || []);
    files.forEach(function(file) {
      var r = new FileReader();
      r.onload = function() { photosRef.current.push({ file: file, preview: r.result }); tick(function(n) { return n + 1; }); };
      r.readAsDataURL(file);
    });
  }
  function removePhoto(i) { photosRef.current.splice(i, 1); tick(function(n) { return n + 1; }); }

  function submit(e) {
    e.preventDefault();
    if (!formRef.current.first_name.trim()) { toast.error('First name required'); return; }
    setSaving(true);
    axios.post(API + '/seeker/profiles', formRef.current, getHeaders())
      .then(function(res) {
        var pid = res.data.id;
        var uploads = photosRef.current.map(function(p) {
          var fd = new FormData(); fd.append('photo', p.file);
          return axios.post(API + '/seeker/profiles/' + pid + '/photos', fd, getHeaders());
        });
        return Promise.all(uploads).then(function() { return axios.get(API + '/seeker/profiles/' + pid, getHeaders()); });
      })
      .then(function(res) { props.onDone(res.data); toast.success('Created'); })
      .catch(function(err) { toast.error(err.response && err.response.data && err.response.data.detail || 'Failed'); })
      .finally(function() { setSaving(false); });
  }

  var f = formRef.current;
  var photos = photosRef.current;

  return React.createElement('form', { onSubmit: submit, className: 'space-y-6' },
    React.createElement('div', { className: 'flex items-center gap-4' },
      React.createElement(Button, { type: 'button', variant: 'outline', size: 'sm', onClick: props.onCancel, className: 'border-zinc-700 text-zinc-300' },
        React.createElement(ChevronLeft, { className: 'w-4 h-4 mr-1' }), ' Cancel'),
      React.createElement('h2', { className: 'text-xl font-bold text-white' }, 'New Profile')
    ),
    React.createElement(Card, { className: 'bg-zinc-900/50 border-zinc-800' },
      React.createElement(CardContent, { className: 'p-6 space-y-4' },
        React.createElement('div', { className: 'grid grid-cols-2 gap-4' },
          React.createElement('div', { className: 'space-y-2' }, React.createElement(Label, { className: 'text-zinc-300' }, 'First Name *'), React.createElement(Input, { value: f.first_name, onChange: function(e) { set('first_name', e.target.value); }, className: 'bg-zinc-800/50 border-zinc-700 text-white', required: true })),
          React.createElement('div', { className: 'space-y-2' }, React.createElement(Label, { className: 'text-zinc-300' }, 'Last Name'), React.createElement(Input, { value: f.last_name, onChange: function(e) { set('last_name', e.target.value); }, className: 'bg-zinc-800/50 border-zinc-700 text-white' }))
        ),
        React.createElement('div', { className: 'grid grid-cols-2 gap-4' },
          React.createElement('div', { className: 'space-y-2' }, React.createElement(Label, { className: 'text-zinc-300' }, 'Address'), React.createElement(Input, { value: f.address, onChange: function(e) { set('address', e.target.value); }, className: 'bg-zinc-800/50 border-zinc-700 text-white' })),
          React.createElement('div', { className: 'space-y-2' }, React.createElement(Label, { className: 'text-zinc-300' }, 'Birth Date'), React.createElement(Input, { value: f.birth_date, onChange: function(e) { set('birth_date', e.target.value); }, placeholder: 'DD/MM/YYYY', className: 'bg-zinc-800/50 border-zinc-700 text-white' }))
        ),
        React.createElement('div', { className: 'space-y-2' }, React.createElement(Label, { className: 'text-zinc-300' }, 'Birth Place'), React.createElement(Input, { value: f.birth_place, onChange: function(e) { set('birth_place', e.target.value); }, className: 'bg-zinc-800/50 border-zinc-700 text-white' })),
        React.createElement('div', { className: 'space-y-2' }, React.createElement(Label, { className: 'text-zinc-300' }, 'Notes'), React.createElement(Textarea, { value: f.notes, onChange: function(e) { set('notes', e.target.value); }, className: 'bg-zinc-800/50 border-zinc-700 text-white', rows: 3 })),
        React.createElement('div', { className: 'space-y-2' },
          React.createElement(Label, { className: 'text-zinc-300' }, 'Photos'),
          React.createElement('div', { className: 'border-2 border-dashed border-zinc-700 rounded-xl p-6 text-center cursor-pointer hover:border-purple-600 transition-colors', onClick: function() { fileRef.current && fileRef.current.click(); } },
            React.createElement(Upload, { className: 'w-8 h-8 mx-auto text-zinc-500 mb-2' }),
            React.createElement('p', { className: 'text-zinc-400 text-sm' }, 'Click to add photos')
          ),
          React.createElement('input', { ref: fileRef, type: 'file', accept: 'image/*', multiple: true, hidden: true, onChange: addPhotos }),
          photos.length > 0 ? React.createElement('div', { className: 'grid grid-cols-4 gap-2 mt-2' },
            photos.map(function(p, i) {
              return React.createElement('div', { key: i, className: 'relative group rounded-lg overflow-hidden aspect-square bg-zinc-800' },
                React.createElement('img', { src: p.preview, alt: '', className: 'w-full h-full object-cover' }),
                React.createElement('button', { type: 'button', onClick: function() { removePhoto(i); }, className: 'absolute top-1 right-1 w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity' },
                  React.createElement(X, { className: 'w-3 h-3' })
                )
              );
            })
          ) : null
        ),
        React.createElement(Button, { type: 'submit', disabled: saving, className: 'w-full bg-purple-600 hover:bg-purple-500' }, saving ? 'Creating...' : 'Create Profile')
      )
    )
  );
}

function Detail(props) {
  var _e = useState(false); var editing = _e[0]; var setEditing = _e[1];
  var _f = useState(props.profile); var form = _f[0]; var setForm = _f[1];
  var _u = useState(false); var uploading = _u[0]; var setUploading = _u[1];
  var fileRef = useRef(null);

  useEffect(function() { setForm(props.profile); setEditing(false); }, [props.profile]);

  function save() {
    axios.put(API + '/seeker/profiles/' + props.profile.id, {
      first_name: form.first_name, last_name: form.last_name, address: form.address,
      birth_date: form.birth_date, birth_place: form.birth_place, notes: form.notes, pseudonyms: form.pseudonyms
    }, getHeaders())
      .then(function(r) { props.onUpdate(r.data); setEditing(false); toast.success('Saved'); })
      .catch(function() { toast.error('Save failed'); });
  }

  function uploadPhoto(e) {
    var files = e.target.files;
    if (!files || !files.length) return;
    setUploading(true);
    var uploads = Array.from(files).map(function(file) {
      var fd = new FormData(); fd.append('photo', file);
      return axios.post(API + '/seeker/profiles/' + props.profile.id + '/photos', fd, getHeaders());
    });
    Promise.all(uploads)
      .then(function() { return axios.get(API + '/seeker/profiles/' + props.profile.id, getHeaders()); })
      .then(function(r) { props.onUpdate(r.data); toast.success('Photos uploaded'); })
      .catch(function() { toast.error('Upload failed'); })
      .finally(function() { setUploading(false); });
  }

  function deletePhoto(idx) {
    axios.delete(API + '/seeker/profiles/' + props.profile.id + '/photos/' + idx, getHeaders())
      .then(function() { return axios.get(API + '/seeker/profiles/' + props.profile.id, getHeaders()); })
      .then(function(r) { props.onUpdate(r.data); toast.success('Photo deleted'); })
      .catch(function() { toast.error('Delete failed'); });
  }

  var photos = form.photos || [];

  return React.createElement('div', { className: 'space-y-6' },
    React.createElement('div', { className: 'flex items-center gap-4' },
      React.createElement(Button, { variant: 'outline', size: 'sm', onClick: props.onBack, className: 'border-zinc-700 text-zinc-300' }, React.createElement(ChevronLeft, { className: 'w-4 h-4 mr-1' }), ' Back'),
      React.createElement('h2', { className: 'text-xl font-bold text-white flex-1' }, form.first_name + ' ' + (form.last_name || '')),
      editing
        ? React.createElement(Button, { size: 'sm', onClick: save, className: 'bg-emerald-600 hover:bg-emerald-500' }, React.createElement(Save, { className: 'w-4 h-4 mr-1' }), ' Save')
        : React.createElement(Button, { variant: 'outline', size: 'sm', onClick: function() { setEditing(true); }, className: 'border-zinc-700 text-zinc-300' }, React.createElement(Edit2, { className: 'w-4 h-4 mr-1' }), ' Edit')
    ),
    React.createElement('div', { className: 'grid grid-cols-1 lg:grid-cols-2 gap-6' },
      React.createElement(Card, { className: 'bg-zinc-900/50 border-zinc-800' },
        React.createElement(CardHeader, null, React.createElement(CardTitle, { className: 'text-white text-base' }, 'Information')),
        React.createElement(CardContent, { className: 'space-y-3' },
          ['first_name', 'last_name', 'address', 'birth_date', 'birth_place'].map(function(k) {
            var label = k.replace('_', ' ').replace(/\b\w/g, function(c) { return c.toUpperCase(); });
            return React.createElement('div', { key: k, className: 'space-y-1' },
              React.createElement(Label, { className: 'text-zinc-400 text-xs' }, label),
              editing
                ? React.createElement(Input, { value: form[k] || '', onChange: function(e) { setForm(function(f) { var n = Object.assign({}, f); n[k] = e.target.value; return n; }); }, className: 'bg-zinc-800/50 border-zinc-700 text-white' })
                : React.createElement('p', { className: 'text-white' }, form[k] || '-')
            );
          }),
          React.createElement('div', { className: 'space-y-1' },
            React.createElement(Label, { className: 'text-zinc-400 text-xs' }, 'Notes'),
            editing
              ? React.createElement(Textarea, { value: form.notes || '', onChange: function(e) { setForm(function(f) { return Object.assign({}, f, { notes: e.target.value }); }); }, className: 'bg-zinc-800/50 border-zinc-700 text-white', rows: 3 })
              : React.createElement('p', { className: 'text-white whitespace-pre-wrap' }, form.notes || '-')
          )
        )
      ),
      React.createElement(Card, { className: 'bg-zinc-900/50 border-zinc-800' },
        React.createElement(CardHeader, null,
          React.createElement('div', { className: 'flex items-center justify-between' },
            React.createElement(CardTitle, { className: 'text-white text-base' }, 'Photos (' + photos.length + ')'),
            React.createElement(Button, { size: 'sm', variant: 'outline', onClick: function() { fileRef.current && fileRef.current.click(); }, disabled: uploading, className: 'border-zinc-700 text-zinc-300' },
              React.createElement(Upload, { className: 'w-4 h-4 mr-1' }), uploading ? 'Uploading...' : 'Add'),
            React.createElement('input', { ref: fileRef, type: 'file', accept: 'image/*', multiple: true, hidden: true, onChange: uploadPhoto })
          )
        ),
        React.createElement(CardContent, null,
          photos.length === 0
            ? React.createElement('div', { className: 'text-center py-12 text-zinc-500' }, React.createElement(Image, { className: 'w-10 h-10 mx-auto mb-2 opacity-50' }), React.createElement('p', null, 'No photos'))
            : React.createElement('div', { className: 'grid grid-cols-2 sm:grid-cols-3 gap-3' },
                photos.map(function(photo, idx) {
                  return React.createElement('div', { key: idx, className: 'relative group rounded-lg overflow-hidden aspect-square bg-zinc-800' },
                    React.createElement('img', { src: photo, alt: '', className: 'w-full h-full object-cover' }),
                    React.createElement('button', { onClick: function() { deletePhoto(idx); }, className: 'absolute top-1 right-1 w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity' },
                      React.createElement(X, { className: 'w-3 h-3' })
                    )
                  );
                })
              )
        )
      )
    )
  );
}
