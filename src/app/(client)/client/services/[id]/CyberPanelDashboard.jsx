'use client';

import React from 'react';
import WordPressInstallButton from './WordPressInstallButton';

export default function CyberPanelDashboard({ service }) {
  if (!service.cyberPanelDetail) return null;
  const detail = service.cyberPanelDetail;
  const cpUrl = detail.server.url.includes(':8090') ? detail.server.url : `${detail.server.url}:8090`;
  const domainUrl = `http://${detail.domainName}`;

  return (
    <div className="mt-4">
      <h3 className="mb-3 fw-bold">Dashboard</h3>
      
      {/* Top Header Card */}
      <div className="card shadow-sm border-0 mb-4" style={{ borderRadius: '12px' }}>
        <div className="card-body d-flex flex-column flex-md-row align-items-center justify-content-between p-4">
          <div className="d-flex align-items-center mb-3 mb-md-0">
            <div className="bg-light rounded-circle d-flex align-items-center justify-content-center border" style={{ width: '60px', height: '60px' }}>
              <i className="ri-wordpress-fill fs-1 text-secondary"></i>
            </div>
            <div className="ms-3">
              <h4 className="mb-1 fw-bold">
                <a href={domainUrl} target="_blank" rel="noopener noreferrer" className="text-dark text-decoration-none">
                  {detail.domainName} <i className="ri-external-link-line fs-5 text-muted"></i>
                </a>
              </h4>
              <p className="mb-0 text-muted small">Created: {new Date(detail.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
          <div>
             <WordPressInstallButton 
                serviceId={service.id} 
                domainName={detail.domainName}
                email={service.client?.user?.email || 'admin@example.com'}
              />
          </div>
        </div>
      </div>

      <div className="row">
        {/* Site Health */}
        <div className="col-12 mb-4">
          <div className="card shadow-sm border-0" style={{ borderRadius: '12px' }}>
            <div className="card-header bg-white border-bottom-0 pt-4 pb-0">
              <h5 className="fw-bold mb-0">Site health <span className="badge bg-warning text-dark ms-2 rounded-pill">Action needed</span></h5>
            </div>
            <div className="card-body">
              <div className="row text-center text-md-start">
                <div className="col-md-4 mb-3 mb-md-0 border-md-end">
                  <p className="mb-1 text-muted small">WordPress version: <span className="fw-bold text-dark">N/A</span></p>
                  <p className="mb-0 text-muted small">PHP version: <span className="fw-bold text-dark">{detail.phpVersion}</span> <a href={cpUrl} target="_blank" rel="noreferrer" className="text-primary text-decoration-none ms-1">Review</a></p>
                </div>
                <div className="col-md-4 mb-3 mb-md-0 border-md-end">
                  <p className="mb-1 text-muted small">Active theme: <span className="fw-bold text-dark">N/A</span></p>
                  <p className="mb-0 text-muted small">Plugins: <span className="fw-bold text-dark">Up to date</span></p>
                </div>
                <div className="col-md-4">
                  <p className="mb-0 text-muted small">Vulnerabilities: <span className="fw-bold text-dark">None detected</span></p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Essentials Grid */}
        <div className="col-md-6 mb-4">
          <div className="card shadow-sm border-0 h-100" style={{ borderRadius: '12px' }}>
            <div className="card-header bg-white border-bottom-0 pt-4 pb-0">
              <h5 className="fw-bold mb-0">Essentials</h5>
            </div>
            <div className="card-body">
              <ul className="list-group list-group-flush">
                <li className="list-group-item d-flex justify-content-between align-items-center px-0 py-3 border-bottom">
                  <div className="d-flex align-items-center">
                    <i className="ri-database-2-line fs-3 text-secondary me-3"></i>
                    <div>
                      <h6 className="mb-0 fw-bold">Database</h6>
                      <small className="text-muted">Manage database</small>
                    </div>
                  </div>
                  <a href={cpUrl} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline-secondary rounded-pill px-3">Manage</a>
                </li>
                <li className="list-group-item d-flex justify-content-between align-items-center px-0 py-3 border-bottom">
                  <div className="d-flex align-items-center">
                    <i className="ri-history-line fs-3 text-secondary me-3"></i>
                    <div>
                      <h6 className="mb-0 fw-bold">Backups</h6>
                      <small className="text-muted">Daily</small>
                    </div>
                  </div>
                  <a href={cpUrl} target="_blank" rel="noreferrer" className="text-secondary"><i className="ri-arrow-right-s-line fs-4"></i></a>
                </li>
                <li className="list-group-item d-flex justify-content-between align-items-center px-0 py-3 border-bottom">
                  <div className="d-flex align-items-center">
                    <i className="ri-folder-open-line fs-3 text-secondary me-3"></i>
                    <div>
                      <h6 className="mb-0 fw-bold">File manager</h6>
                      <small className="text-muted">Edit your files</small>
                    </div>
                  </div>
                  <a href={cpUrl} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline-secondary rounded-pill px-3">Open <i className="ri-external-link-line"></i></a>
                </li>
                <li className="list-group-item d-flex justify-content-between align-items-center px-0 py-3">
                  <div className="d-flex align-items-center">
                    <i className="ri-server-line fs-3 text-secondary me-3"></i>
                    <div>
                      <h6 className="mb-0 fw-bold">Hosting plan</h6>
                      <small className="text-muted">{detail.packageName} Hosting</small>
                    </div>
                  </div>
                  <a href={cpUrl} target="_blank" rel="noreferrer" className="text-secondary"><i className="ri-arrow-right-s-line fs-4"></i></a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Resource Usage & Performance */}
        <div className="col-md-6 mb-4">
          <div className="row h-100">
             {/* Performance */}
             <div className="col-12 mb-4">
               <div className="card shadow-sm border-0 h-100" style={{ borderRadius: '12px' }}>
                  <div className="card-header bg-white border-bottom-0 pt-4 pb-0 d-flex justify-content-between align-items-center">
                    <h5 className="fw-bold mb-0">Performance</h5>
                    <button className="btn btn-sm btn-outline-secondary rounded-pill px-3">Run speed test</button>
                  </div>
                  <div className="card-body d-flex justify-content-around align-items-center">
                     <div className="text-center">
                        <div className="bg-light rounded-circle d-flex align-items-center justify-content-center border border-dashed mb-2 mx-auto" style={{ width: '70px', height: '70px' }}>
                          <i className="ri-computer-line fs-3 text-muted"></i>
                        </div>
                        <h6 className="mb-0 fw-bold">Desktop</h6>
                        <small className="text-muted">Not scanned yet</small>
                     </div>
                     <div className="text-center">
                        <div className="bg-light rounded-circle d-flex align-items-center justify-content-center border border-dashed mb-2 mx-auto" style={{ width: '70px', height: '70px' }}>
                          <i className="ri-smartphone-line fs-3 text-muted"></i>
                        </div>
                        <h6 className="mb-0 fw-bold">Mobile</h6>
                        <small className="text-muted">Not scanned yet</small>
                     </div>
                  </div>
               </div>
             </div>
             
             {/* Resource Usage */}
             <div className="col-12">
               <div className="card shadow-sm border-0 h-100" style={{ borderRadius: '12px' }}>
                  <div className="card-header bg-white border-bottom-0 pt-4 pb-0 d-flex justify-content-between align-items-center">
                    <h5 className="fw-bold mb-0">Plan resource usage</h5>
                    <a href={cpUrl} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline-secondary rounded-pill px-3">See details</a>
                  </div>
                  <div className="card-body d-flex align-items-center">
                    <div className="me-4 position-relative">
                      {/* Simple CSS Donut representation */}
                      <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: 'conic-gradient(#6f42c1 30%, #e9ecef 30%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                         <div style={{ width: '70px', height: '70px', borderRadius: '50%', backgroundColor: 'white' }}></div>
                      </div>
                    </div>
                    <div className="flex-grow-1">
                      <div className="mb-3">
                        <small className="text-muted d-block mb-1">Disk usage</small>
                        <h6 className="mb-0 fw-bold text-purple" style={{ color: '#6f42c1' }}>N/A <span className="text-muted small fw-normal">/ 100 GB</span></h6>
                      </div>
                      <div className="mb-3">
                        <small className="text-muted d-block mb-1">Inodes</small>
                        <h6 className="mb-0 fw-bold text-success">N/A <span className="text-muted small fw-normal">/ 2000K</span></h6>
                      </div>
                      <div>
                        <small className="text-muted d-block mb-1"><i className="ri-information-line"></i> Last 24 hours</small>
                      </div>
                    </div>
                  </div>
               </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
