import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Upload, 
  FileSpreadsheet, 
  Download, 
  CheckCircle, 
  AlertTriangle, 
  XCircle,
  HelpCircle,
  FileCheck
} from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const ImportContacts = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [duplicateAction, setDuplicateAction] = useState('skip');
  const [importing, setImporting] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDownloadSample = () => {
    window.open(`${api.defaults.baseURL}/contacts/sample-template`, '_blank');
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      processSelectedFile(e.target.files[0]);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const processSelectedFile = async (selectedFile) => {
    const ext = selectedFile.name.substring(selectedFile.name.lastIndexOf('.')).toLowerCase();
    if (!['.xlsx', '.xls', '.csv'].includes(ext)) {
      toast.error('Invalid file format. Please upload an Excel (.xlsx, .xls) or CSV (.csv) file.');
      return;
    }

    setFile(selectedFile);
    setUploading(true);
    setPreviewData(null);

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const res = await api.post('/contacts/import/preview', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setPreviewData(res.data.data);
      toast.success(`Parsed ${res.data.data.totalRows} rows. Review preview below.`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to parse file.');
      setFile(null);
    } finally {
      setUploading(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!previewData) return;

    const contactsToProcess = [
      ...(previewData.validRows || []),
      ...(previewData.existingRows || [])
    ];

    if (contactsToProcess.length === 0) {
      toast.error('No valid rows available to import.');
      return;
    }

    setImporting(true);
    try {
      const res = await api.post('/contacts/import/confirm', {
        contacts: contactsToProcess,
        duplicateAction
      });
      toast.success(res.data.message || 'Contacts imported successfully!');
      navigate('/contacts');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to complete import.');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center mb-4 gap-3">
        <div>
          <h4 className="fw-extrabold text-dark mb-1">Import HR Contacts</h4>
          <p className="text-muted small mb-0">
            Upload candidate spreadsheets (.xlsx, .xls, .csv). Validate format and save to database.
          </p>
        </div>
        <button
          onClick={handleDownloadSample}
          className="btn btn-light btn-sm d-flex align-items-center gap-2 rounded-3 border shadow-sm align-self-start align-self-sm-center"
        >
          <Download size={15} className="text-primary" /> Download Sample Template
        </button>
      </div>

      {/* Upload Dropzone */}
      <div className="card-modern p-3 p-sm-4 mb-4">
        <div
          className={`dropzone ${isDragOver ? 'active' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            type="file"
            ref={fileInputRef}
            className="d-none"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileChange}
          />
          <div
            className="mx-auto mb-2 text-primary d-flex align-items-center justify-content-center"
            style={{ width: 50, height: 50, backgroundColor: '#eff6ff', borderRadius: '50%' }}
          >
            <Upload size={24} />
          </div>
          <h6 className="fw-bold text-dark mb-1 small">
            {file ? file.name : 'Tap to select or drop Excel/CSV file here'}
          </h6>
          <p className="text-muted small mb-2" style={{ fontSize: '0.775rem' }}>
            Supports .xlsx, .xls, and .csv files up to 10 MB.
          </p>
          <span className="badge bg-light text-secondary border font-monospace" style={{ fontSize: '0.7rem' }}>
            Columns: Name, Emails, Title, Company
          </span>
        </div>

        {uploading && (
          <div className="text-center py-3">
            <div className="spinner-border text-primary spinner-border-sm me-2" />
            <span className="text-muted small">Validating rows...</span>
          </div>
        )}
      </div>

      {/* Preview Section */}
      {previewData && (
        <div className="card-modern mb-4">
          <div className="card-header-clean d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-2">
            <div>
              <h6 className="fw-bold mb-0">Spreadsheet Preview</h6>
              <small className="text-muted">Review detected rows</small>
            </div>
            <div className="d-flex align-items-center gap-2">
              <label className="small fw-semibold text-secondary text-nowrap">Duplicates:</label>
              <select
                className="form-select form-select-sm"
                value={duplicateAction}
                onChange={(e) => setDuplicateAction(e.target.value)}
                style={{ width: 150 }}
              >
                <option value="skip">Skip duplicates</option>
                <option value="update">Update existing</option>
              </select>
            </div>
          </div>

          {/* Stat Pill Summary: 2x2 grid on mobile */}
          <div className="p-2 p-sm-3 bg-light border-bottom">
            <div className="row g-2 text-center">
              <div className="col-6 col-sm-3">
                <div className="bg-white p-2 rounded-3 border">
                  <div className="text-muted" style={{ fontSize: '0.7rem', fontWeight: 700 }}>TOTAL ROWS</div>
                  <div className="fw-extrabold fs-5 text-dark">{previewData.totalRows}</div>
                </div>
              </div>
              <div className="col-6 col-sm-3">
                <div className="bg-white p-2 rounded-3 border">
                  <div className="text-success" style={{ fontSize: '0.7rem', fontWeight: 700 }}>VALID NEW</div>
                  <div className="fw-extrabold fs-5 text-success">{previewData.validNewCount}</div>
                </div>
              </div>
              <div className="col-6 col-sm-3">
                <div className="bg-white p-2 rounded-3 border">
                  <div className="text-warning" style={{ fontSize: '0.7rem', fontWeight: 700 }}>IN DATABASE</div>
                  <div className="fw-extrabold fs-5 text-warning">{previewData.existingInDbCount}</div>
                </div>
              </div>
              <div className="col-6 col-sm-3">
                <div className="bg-white p-2 rounded-3 border">
                  <div className="text-danger" style={{ fontSize: '0.7rem', fontWeight: 700 }}>ERRORS</div>
                  <div className="fw-extrabold fs-5 text-danger">{previewData.invalidCount + previewData.fileDuplicateCount}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Preview Table */}
          <div className="table-responsive" style={{ maxHeight: 360 }}>
            <table className="table table-modern table-sm align-middle">
              <thead>
                <tr>
                  <th style={{ width: 50 }}>#</th>
                  <th>Name & Email</th>
                  <th>Company</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {previewData.previewItems?.map((row, idx) => (
                  <tr key={idx} className={!row.isValid ? 'table-danger bg-opacity-10' : row.existsInDb ? 'table-warning bg-opacity-10' : ''}>
                    <td className="text-muted small">{row.rowNumber}</td>
                    <td>
                      <div className="fw-bold text-dark">{row.name || <em className="text-danger">Missing</em>}</div>
                      <small className="text-muted">{row.email || <em className="text-danger">Missing</em>}</small>
                    </td>
                    <td>{row.company || '—'}</td>
                    <td>
                      {!row.isValid ? (
                        <span className="badge bg-danger-subtle text-danger border border-danger-subtle d-inline-flex align-items-center gap-1 small">
                          <XCircle size={12} /> {row.errors?.join(', ')}
                        </span>
                      ) : row.existsInDb ? (
                        <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle d-inline-flex align-items-center gap-1 small">
                          <AlertTriangle size={12} /> Already in DB
                        </span>
                      ) : (
                        <span className="badge bg-success-subtle text-success border border-success-subtle d-inline-flex align-items-center gap-1 small">
                          <CheckCircle size={12} /> Ready
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Action Footer */}
          <div className="p-3 border-top d-flex justify-content-between align-items-center">
            <button
              onClick={() => { setFile(null); setPreviewData(null); }}
              className="btn btn-light btn-sm border"
            >
              Reset
            </button>
            <button
              onClick={handleConfirmImport}
              disabled={importing || (previewData.validNewCount === 0 && previewData.existingInDbCount === 0)}
              className="btn btn-primary btn-sm px-4 shadow-sm"
            >
              {importing ? 'Saving...' : 'Confirm & Save'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImportContacts;
