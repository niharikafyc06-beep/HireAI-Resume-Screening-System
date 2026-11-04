import { useState } from "react";
import "./App.css";

function App() {
  const [jobTitle, setJobTitle] = useState("");
  const [requiredSkills, setRequiredSkills] = useState("");
  const [preferredSkills, setPreferredSkills] = useState("");
  const [experience, setExperience] = useState("");
  const [jobDescription, setJobDescription] = useState("");

  const [files, setFiles] = useState([]);
  const [results, setResults] = useState([]);
  const [jobCreated, setJobCreated] = useState(false);

  const [loadingJob, setLoadingJob] = useState(false);
  const [loadingScreening, setLoadingScreening] = useState(false);
  const [message, setMessage] = useState("");

  // Add multiple PDF files
  const handleFileChange = (event) => {
    const selectedFiles = Array.from(event.target.files);

    const validFiles = selectedFiles.filter(
      (file) => file.name.toLowerCase().endsWith(".pdf")
    );

    if (validFiles.length !== selectedFiles.length) {
      setMessage("Only PDF files are allowed.");
    } else {
      setMessage("");
    }

    // Add new files without deleting previously selected files
    setFiles((previousFiles) => {
      const combinedFiles = [...previousFiles, ...validFiles];

      // Avoid adding the same file twice
      return combinedFiles.filter(
        (file, index, self) =>
          index ===
          self.findIndex(
            (item) =>
              item.name === file.name &&
              item.size === file.size &&
              item.lastModified === file.lastModified
          )
      );
    });

    // Reset input so the same file can be selected again if needed
    event.target.value = "";
  };

  // Remove a selected PDF
  const removeFile = (indexToRemove) => {
    setFiles((previousFiles) =>
      previousFiles.filter((_, index) => index !== indexToRemove)
    );
  };

  // Create job requirements
  const handleCreateJob = async (event) => {
    event.preventDefault();

    if (!jobTitle.trim() || !requiredSkills.trim()) {
      setMessage("Please enter the job title and required skills.");
      return;
    }

    const jobData = {
      job_title: jobTitle,
      required_skills: requiredSkills
        .split(",")
        .map((skill) => skill.trim())
        .filter(Boolean),
      preferred_skills: preferredSkills
        .split(",")
        .map((skill) => skill.trim())
        .filter(Boolean),
      experience: experience,
      job_description: jobDescription,
    };

    try {
      setLoadingJob(true);
      setMessage("");

      const response = await fetch("http://127.0.0.1:8000/job/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(jobData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Unable to create job.");
      }

      setJobCreated(true);
      setResults([]);
      setMessage("Job requirements saved successfully!");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoadingJob(false);
    }
  };

  // Upload and rank all selected PDF resumes together
  const handleScreening = async () => {
    if (!jobCreated) {
      setMessage("Please save job requirements first.");
      return;
    }

    if (files.length === 0) {
      setMessage("Please select at least one PDF resume.");
      return;
    }

    const formData = new FormData();

    // IMPORTANT: The backend expects the field name "files"
    files.forEach((file) => {
      formData.append("files", file);
    });

    try {
      setLoadingScreening(true);
      setMessage("");
      setResults([]);

      const response = await fetch(
        "http://127.0.0.1:8000/screening/rank",
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Resume screening failed.");
      }

      setResults(data.ranking || []);
      setMessage(
        `Successfully analyzed ${data.total_candidates} candidate(s)!`
      );
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoadingScreening(false);
    }
  };

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="logo">
          <span className="logo-icon">H</span>
          <span>HireAI</span>
        </div>

        <p className="sidebar-label">MAIN MENU</p>

        <a href="#dashboard" className="nav-link active">
          <span>▦</span> Dashboard
        </a>

        <a href="#job-section" className="nav-link">
          <span>▤</span> Job Requirements
        </a>

        <a href="#upload-section" className="nav-link">
          <span>⇧</span> Upload Resumes
        </a>

        <a href="#results-section" className="nav-link">
          <span>☷</span> Candidates
        </a>

        <div className="sidebar-bottom">
          <div className="sidebar-note">
            <span>✦</span>
            <p>AI-powered resume screening made simple.</p>
          </div>
        </div>
      </aside>

      <main className="main-content" id="dashboard">
        <header className="topbar">
          <div>
            <p className="topbar-small">AI RECRUITMENT PLATFORM</p>
            <h2>Resume Screening Dashboard</h2>
          </div>
          <div className="profile">
            <div className="profile-avatar">HR</div>
            <span>Recruiter</span>
          </div>
        </header>

        <section className="welcome-banner">
          <div>
            <p className="banner-tag">SMART HIRING STARTS HERE</p>
            <h1>Find the right talent faster.</h1>
            <p>
              Upload resumes, compare candidate skills and rank applicants
              using AI-powered matching.
            </p>
            <a href="#job-section" className="banner-button">
              Get Started →
            </a>
          </div>
          <div className="banner-art">✦</div>
        </section>

        <section className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon purple">▤</div>
            <p>Total Resumes Selected</p>
            <h2>{files.length}</h2>
          </div>

          <div className="stat-card">
            <div className="stat-icon blue">✓</div>
            <p>Resumes Analyzed</p>
            <h2>{results.length}</h2>
          </div>

          <div className="stat-card">
            <div className="stat-icon green">✦</div>
            <p>Job Status</p>
            <h2 className="status-text">
              {jobCreated ? "Created" : "Not Created"}
            </h2>
          </div>
        </section>

        {/* JOB REQUIREMENTS */}
        <section className="section-card" id="job-section">
          <div className="section-heading">
            <div>
              <p className="section-tag">STEP 01</p>
              <h2>Job Requirements</h2>
              <p>Enter the details of the job you want to hire for.</p>
            </div>
            <span className="section-icon">▤</span>
          </div>

          <form onSubmit={handleCreateJob}>
            <div className="form-grid">
              <div className="form-group">
                <label>Job Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Python Developer"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Required Skills *</label>
                <input
                  type="text"
                  placeholder="Python, SQL, FastAPI"
                  value={requiredSkills}
                  onChange={(e) => setRequiredSkills(e.target.value)}
                  required
                />
                <small>Separate skills with commas.</small>
              </div>

              <div className="form-group">
                <label>Preferred Skills</label>
                <input
                  type="text"
                  placeholder="AWS, Docker, Git"
                  value={preferredSkills}
                  onChange={(e) => setPreferredSkills(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Required Experience</label>
                <input
                  type="text"
                  placeholder="e.g. 1 year"
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                />
              </div>

              <div className="form-group full-width">
                <label>Job Description</label>
                <textarea
                  placeholder="Write the job responsibilities, qualifications and other details..."
                  rows="4"
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              className="primary-button"
              disabled={loadingJob}
            >
              {loadingJob ? "Saving..." : "Save Job Requirements →"}
            </button>
          </form>
        </section>

        {/* MULTIPLE RESUME UPLOAD */}
        <section className="section-card" id="upload-section">
          <div className="section-heading">
            <div>
              <p className="section-tag">STEP 02</p>
              <h2>Upload Candidate Resumes</h2>
              <p>Select multiple PDF resumes together.</p>
            </div>
            <span className="section-icon">⇧</span>
          </div>

          <div className="upload-area">
            <div className="upload-icon">⇧</div>
            <h3>Upload multiple resumes</h3>
            <p>
              Select several PDF files at once or add more files later.
            </p>

            <label htmlFor="resume-upload" className="upload-button">
              + Choose PDF Files
            </label>

            {/* MULTIPLE ATTRIBUTE ALLOWS MULTIPLE FILE SELECTION */}
            <input
              id="resume-upload"
              type="file"
              accept=".pdf,application/pdf"
              multiple
              onChange={handleFileChange}
              hidden
            />

            <p className="upload-hint">PDF files only</p>
          </div>

          {files.length > 0 && (
            <div className="selected-files">
              <div className="files-heading">
                <h3>Selected Resumes ({files.length})</h3>
                <button
                  className="clear-button"
                  onClick={() => setFiles([])}
                  type="button"
                >
                  Clear All
                </button>
              </div>

              {files.map((file, index) => (
                <div className="file-item" key={`${file.name}-${index}`}>
                  <div className="file-info">
                    <div className="pdf-icon">PDF</div>
                    <div>
                      <p className="file-name">{file.name}</p>
                      <small>{(file.size / 1024).toFixed(1)} KB</small>
                    </div>
                  </div>

                  <button
                    className="remove-button"
                    onClick={() => removeFile(index)}
                    type="button"
                    title="Remove file"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          <button
            className="primary-button analyze-button"
            onClick={handleScreening}
            disabled={loadingScreening || files.length === 0 || !jobCreated}
          >
            {loadingScreening
              ? "Analyzing Resumes..."
              : `Analyze & Rank ${files.length} Candidate(s) →`}
          </button>

          {!jobCreated && (
            <p className="helper-text">
              First save your job requirements to enable screening.
            </p>
          )}
        </section>

        {/* CANDIDATE RESULTS */}
        <section className="section-card" id="results-section">
          <div className="section-heading">
            <div>
              <p className="section-tag">STEP 03</p>
              <h2>Candidate Rankings</h2>
              <p>Compare candidates based on their matching scores.</p>
            </div>
            <span className="section-icon">☷</span>
          </div>

          {results.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">☷</div>
              <h3>No candidates analyzed yet</h3>
              <p>Upload PDF resumes and click Analyze & Rank Candidates.</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Candidate</th>
                    <th>Email</th>
                    <th>Experience</th>
                    <th>Required Skills</th>
                    <th>Match Score</th>
                  </tr>
                </thead>

                <tbody>
                  {results.map((candidate, index) => (
                    <tr key={`${candidate.candidate}-${index}`}>
                      <td>
                        <span className="rank-badge">
                          #{candidate.rank || index + 1}
                        </span>
                      </td>

                      <td>
                        <strong>
                          {candidate.candidate_details?.name || "Not found"}
                        </strong>
                        <small className="candidate-file">
                          {candidate.candidate}
                        </small>
                      </td>

                      <td>
                        {candidate.candidate_details?.email || "Not found"}
                      </td>

                      <td>
                        {candidate.candidate_details?.experience_years ?? 0}{" "}
                        years
                      </td>

                      <td>
                        {candidate.required_skill_score ?? 0}%
                      </td>

                      <td>
                        <div className="score-cell">
                          <strong>{candidate.score}%</strong>
                          <div className="score-bar">
                            <div
                              className="score-fill"
                              style={{
                                width: `${Math.min(
                                  100,
                                  Math.max(0, candidate.score)
                                )}%`,
                              }}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {results.map((candidate, index) => (
            <div className="candidate-details" key={`details-${index}`}>
              <h3>
                #{candidate.rank || index + 1}{" "}
                {candidate.candidate_details?.name || candidate.candidate}
              </h3>

              <div className="skills-grid">
                <div>
                  <p className="skill-heading matched-heading">
                    ✓ Matched Required Skills
                  </p>
                  <div className="skill-tags">
                    {candidate.matched_required?.length > 0
                      ? candidate.matched_required.map((skill) => (
                          <span className="skill-tag matched" key={skill}>
                            {skill}
                          </span>
                        ))
                      : "No matched required skills"}
                  </div>
                </div>

                <div>
                  <p className="skill-heading missing-heading">
                    ✕ Missing Required Skills
                  </p>
                  <div className="skill-tags">
                    {candidate.missing_required?.length > 0
                      ? candidate.missing_required.map((skill) => (
                          <span className="skill-tag missing" key={skill}>
                            {skill}
                          </span>
                        ))
                      : "No missing required skills"}
                  </div>
                </div>
              </div>

              <p className="all-skills">
                <strong>All detected skills:</strong>{" "}
                {candidate.resume_skills?.join(", ") || "None detected"}
              </p>

              <div className="score-breakdown">
                <span>Semantic: {candidate.semantic_score}%</span>
                <span>
                  Required skills: {candidate.required_skill_score}%
                </span>
                <span>
                  Preferred skills: {candidate.preferred_skill_score}%
                </span>
                <span>Experience: {candidate.experience_score}%</span>
              </div>
            </div>
          ))}
        </section>

        {message && (
          <div className="message-box" role="status">
            {message}
          </div>
        )}

        <footer>
          <p>HireAI © 2026 | AI-Powered Resume Screening System</p>
        </footer>
      </main>
    </div>
  );
}

export default App;