
import { useState, useEffect } from "react";
import API from "./api";
import "./App.css";

function App() {
  // Authentication states
  const [token, setToken] = useState(null);
  const [authChecking, setAuthChecking] = useState(true);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);

  // Job states
  const [jobs, setJobs] = useState([]);
  const [jobId, setJobId] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [requiredSkills, setRequiredSkills] = useState("");
  const [preferredSkills, setPreferredSkills] = useState("");
  const [experience, setExperience] = useState("");
  const [jobDescription, setJobDescription] = useState("");

  // Resume and screening states
  const [files, setFiles] = useState([]);
  const [results, setResults] = useState([]);
  const [history, setHistory] = useState([]);

  // Loading states
  const [loadingJob, setLoadingJob] = useState(false);
  const [loadingScreening, setLoadingScreening] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const [message, setMessage] = useState("");

  // Load jobs
  const loadJobs = async () => {
    try {
      const response = await API.get("/job/current");
      const jobList = response.data.jobs || [];

      setJobs(jobList);

      if (jobList.length > 0) {
        setJobId((previous) => previous || String(jobList[0].job_id));
      }
    } catch (error) {
      console.error("Job loading error:", error);
      setMessage(
        error.response?.data?.detail || "Unable to load jobs."
      );
    }
  };

  // Load screening history
  const loadHistory = async (selectedJobId = "") => {
    try {
      setLoadingHistory(true);

      const params = selectedJobId
        ? { job_id: selectedJobId }
        : {};

      const response = await API.get("/screening/history", {
        params,
      });

      setHistory(response.data.history || []);
    } catch (error) {
      console.error("History error:", error);
      setMessage("Unable to load screening history.");
    } finally {
      setLoadingHistory(false);
    }
  };

  // Verify saved login session before showing dashboard
  useEffect(() => {
    let isMounted = true;

    const verifySession = async () => {
      const savedToken = localStorage.getItem("token");

      if (!savedToken) {
        if (isMounted) {
          setToken(null);
          setAuthChecking(false);
        }
        return;
      }

      try {
        await API.get("/auth/me");

        if (isMounted) {
          setToken(savedToken);
          await loadJobs();
          await loadHistory("");
        }
      } catch (error) {
        console.error("Authentication error:", error);

        localStorage.removeItem("token");

        if (isMounted) {
          setToken(null);
          setMessage("Session expired. Please log in again.");
        }
      } finally {
        if (isMounted) {
          setAuthChecking(false);
        }
      }
    };

    verifySession();

    return () => {
      isMounted = false;
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // LOGIN
  const handleLogin = async (event) => {
    event.preventDefault();

    try {
      setAuthLoading(true);
      setMessage("Logging in...");

      const formData = new URLSearchParams();
      formData.append("username", email.trim().toLowerCase());
      formData.append("password", password);

      const response = await API.post(
        "/auth/login",
        formData,
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );

      const accessToken = response.data.access_token;

      if (!accessToken) {
        throw new Error("Access token was not received.");
      }

      localStorage.setItem("token", accessToken);
      setToken(accessToken);
      setPassword("");
      setMessage("Login successful!");

    } catch (error) {
      console.error("Login error:", error);

      setMessage(
        error.response?.data?.detail ||
        error.message ||
        "Login failed. Please try again."
      );

    } finally {
      setAuthLoading(false);
    }
  };

  // SIGN UP
  const handleRegister = async (event) => {
    event.preventDefault();

    if (name.trim().length < 2) {
      setMessage("Please enter your full name.");
      return;
    }

    if (companyName.trim().length < 2) {
      setMessage("Please enter your company name.");
      return;
    }

    if (password.length < 8) {
      setMessage("Password must contain at least 8 characters.");
      return;
    }

    try {
      setAuthLoading(true);
      setMessage("Creating your account...");

      const response = await API.post("/auth/register", {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password: password,
        company_name: companyName.trim(),
      });

      if (response.status === 200 || response.status === 201) {
        setIsRegistering(false);
        setName("");
        setCompanyName("");
        setPassword("");

        setMessage("Account created successfully! Please log in.");
      }

    } catch (error) {
      console.error(
        "Registration error:",
        error.response?.data || error
      );

      const detail = error.response?.data?.detail;

      if (Array.isArray(detail)) {
        setMessage(
          detail.map((item) => item.msg || "Invalid input").join(", ")
        );
      } else if (typeof detail === "string") {
        setMessage(detail);
      } else {
        setMessage("Registration failed. Please try again.");
      }

    } finally {
      setAuthLoading(false);
    }
  };

  // LOGOUT
  const handleLogout = () => {
    localStorage.removeItem("token");

    setToken(null);
    setJobs([]);
    setHistory([]);
    setResults([]);
    setFiles([]);
    setJobId("");
    setEmail("");
    setPassword("");
    setMessage("");
  };

  // CREATE JOB
  const handleCreateJob = async (event) => {
    event.preventDefault();

    if (!jobTitle.trim() || !requiredSkills.trim()) {
      setMessage("Enter job title and required skills.");
      return;
    }

    const jobData = {
      job_title: jobTitle.trim(),

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

      const response = await API.post("/job/create", jobData);

      const newJobId = String(response.data.job_id);

      setJobTitle("");
      setRequiredSkills("");
      setPreferredSkills("");
      setExperience("");
      setJobDescription("");

      await loadJobs();

      setJobId(newJobId);

      await loadHistory(newJobId);

      setMessage("Job created successfully!");

    } catch (error) {
      console.error("Job creation error:", error);

      setMessage(
        error.response?.data?.detail || "Unable to create job."
      );

    } finally {
      setLoadingJob(false);
    }
  };

  // SELECT PDF FILES
  const handleFileChange = (event) => {
    const selectedFiles = Array.from(event.target.files || []);

    const validFiles = selectedFiles.filter((file) =>
      file.name.toLowerCase().endsWith(".pdf")
    );

    if (validFiles.length !== selectedFiles.length) {
      setMessage("Only PDF files are allowed.");
    } else {
      setMessage("");
    }

    setFiles((previous) => {
      const combined = [...previous, ...validFiles];

      return combined.filter(
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

    event.target.value = "";
  };

  // REMOVE SELECTED PDF
  const removeFile = (index) => {
    setFiles((previous) =>
      previous.filter((_, i) => i !== index)
    );
  };

  // ANALYZE AND RANK RESUMES
  const handleScreening = async () => {
    if (!jobId) {
      setMessage("Please create or select a job first.");
      return;
    }

    if (files.length === 0) {
      setMessage("Please select PDF resumes.");
      return;
    }

    const formData = new FormData();

    files.forEach((file) => {
      formData.append("files", file);
    });

    try {
      setLoadingScreening(true);
      setMessage("");
      setResults([]);

      const response = await API.post(
        `/screening/rank?job_id=${jobId}`,
        formData
      );

      setResults(response.data.ranking || []);
      setFiles([]);

      setMessage(
        `${response.data.total_candidates ?? response.data.ranking?.length ?? 0} candidates analyzed successfully!`
      );

      await loadHistory(jobId);

    } catch (error) {
      console.error(
        "Screening error:",
        error.response?.data || error
      );

      const detail = error.response?.data?.detail;

      if (Array.isArray(detail)) {
        setMessage(
          detail.map((item) => item.msg || "Invalid input").join(", ")
        );
      } else if (typeof detail === "string") {
        setMessage(detail);
      } else {
        setMessage("Resume screening failed. Please try again.");
      }

    } finally {
      setLoadingScreening(false);
    }
  };

  // AUTHENTICATION LOADING SCREEN
  if (authChecking) {
    return (
      <div className="app login-page">
        <div className="section-card login-card">
          <div className="logo">
            <span className="logo-icon">H</span>
            <span>HireAI</span>
          </div>

          <h2>Checking your session...</h2>
          <p>Please wait while we verify your login.</p>
        </div>
      </div>
    );
  }

  // LOGIN AND SIGN UP SCREEN
  if (!token) {
    return (
      <div className="app login-page">
        <div className="section-card login-card">

          <div className="logo">
            <span className="logo-icon">H</span>
            <span>HireAI</span>
          </div>

          <h2>
            {isRegistering
              ? "Create Your Account"
              : "Welcome Back"}
          </h2>

          <p>
            {isRegistering
              ? "Create your recruiter account and start hiring smarter."
              : "Sign in to your intelligent recruitment dashboard."}
          </p>

          <form
            onSubmit={
              isRegistering
                ? handleRegister
                : handleLogin
            }
          >

            {isRegistering && (
              <>
                <div className="form-group">
                  <label htmlFor="signup-name">Full Name</label>

                  <input
                    id="signup-name"
                    type="text"
                    placeholder="Enter your full name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    minLength={2}
                    maxLength={100}
                    autoComplete="name"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="signup-company">Company Name</label>

                  <input
                    id="signup-company"
                    type="text"
                    placeholder="Enter your company name"
                    value={companyName}
                    onChange={(event) => setCompanyName(event.target.value)}
                    minLength={2}
                    maxLength={150}
                    required
                  />
                </div>
              </>
            )}

            <div className="form-group">
              <label htmlFor="auth-email">Email Address</label>

              <input
                id="auth-email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="auth-password">Password</label>

              <input
                id="auth-password"
                type="password"
                placeholder={
                  isRegistering
                    ? "Create password (minimum 8 characters)"
                    : "Enter your password"
                }
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                minLength={isRegistering ? 8 : undefined}
                autoComplete={
                  isRegistering ? "new-password" : "current-password"
                }
                required
              />
            </div>

            <button
              className="primary-button"
              type="submit"
              disabled={authLoading}
            >
              {authLoading
                ? isRegistering
                  ? "Creating Account..."
                  : "Logging In..."
                : isRegistering
                  ? "Create Account →"
                  : "Login to HireAI →"}
            </button>

          </form>

          <div style={{ marginTop: 20, textAlign: "center" }}>
            {isRegistering
              ? "Already have an account? "
              : "Don't have an account? "}

            <button
              type="button"
              className="clear-button"
              disabled={authLoading}
              onClick={() => {
                setIsRegistering((current) => !current);
                setMessage("");
                setPassword("");
              }}
            >
              {isRegistering ? "Login" : "Sign Up"}
            </button>
          </div>

          {message && (
            <div
              className="message-box"
              role="status"
              aria-live="polite"
            >
              {message}
            </div>
          )}

        </div>
      </div>
    );
  }

  // RECRUITER DASHBOARD
  return (
    <div className="app">

      {/* Sidebar */}
      <aside className="sidebar">

        <div className="logo">
          <span className="logo-icon">H</span>
          <span>HireAI</span>
        </div>

        <p className="sidebar-label">MAIN MENU</p>

        <a href="#dashboard" className="nav-link active">
          ▦ Dashboard
        </a>

        <a href="#job-section" className="nav-link">
          ▤ Job Requirements
        </a>

        <a href="#upload-section" className="nav-link">
          ⇧ Upload Resumes
        </a>

        <a href="#results-section" className="nav-link">
          ☷ Candidates
        </a>

        <a href="#history-section" className="nav-link">
          ◷ Screening History
        </a>

        <div className="sidebar-bottom">
          <div className="sidebar-note">
            ✦ AI-powered recruitment made simple.
          </div>
        </div>

      </aside>

      {/* Dashboard */}
      <main className="main-content" id="dashboard">

        <header className="topbar">
          <div>
            <p className="topbar-small">AI RECRUITMENT PLATFORM</p>
            <h2>Recruiter Dashboard</h2>
          </div>

          <button className="clear-button" onClick={handleLogout}>
            Logout ↗
          </button>
        </header>

        {/* Welcome Banner */}
        <section className="welcome-banner">
          <div>
            <p className="banner-tag">SMART HIRING STARTS HERE</p>

            <h1>Find the right talent faster.</h1>

            <p>
              Discover, analyze and rank candidates with
              intelligent AI-powered resume screening.
            </p>

            <a href="#job-section" className="banner-button">
              Get Started →
            </a>
          </div>

          <div className="banner-art">✦</div>
        </section>

        {/* Statistics */}
        <section className="stats-grid">

          <div className="stat-card">
            <p>Total Jobs</p>
            <h2>{jobs.length}</h2>
          </div>

          <div className="stat-card">
            <p>Total Screenings</p>
            <h2>{history.length}</h2>
          </div>

          <div className="stat-card">
            <p>Selected Resumes</p>
            <h2>{files.length}</h2>
          </div>

        </section>

        {/* Create Job */}
        <section className="section-card" id="job-section">

          <div className="section-heading">
            <div>
              <p className="section-tag">STEP 01</p>
              <h2>Create Job Requirements</h2>
              <p>Define the skills and experience you need.</p>
            </div>
          </div>

          <form onSubmit={handleCreateJob}>

            <div className="form-grid">

              <div className="form-group">
                <label>Job Title *</label>

                <input
                  value={jobTitle}
                  onChange={(event) => setJobTitle(event.target.value)}
                  placeholder="Java Backend Developer"
                  required
                />
              </div>

              <div className="form-group">
                <label>Required Skills *</label>

                <input
                  value={requiredSkills}
                  onChange={(event) => setRequiredSkills(event.target.value)}
                  placeholder="Java, Spring Boot, SQL"
                  required
                />
              </div>

              <div className="form-group">
                <label>Preferred Skills</label>

                <input
                  value={preferredSkills}
                  onChange={(event) => setPreferredSkills(event.target.value)}
                  placeholder="AWS, Docker, Git"
                />
              </div>

              <div className="form-group">
                <label>Required Experience</label>

                <input
                  value={experience}
                  onChange={(event) => setExperience(event.target.value)}
                  placeholder="1-2 years"
                />
              </div>

              <div className="form-group full-width">
                <label>Job Description</label>

                <textarea
                  rows="4"
                  value={jobDescription}
                  onChange={(event) => setJobDescription(event.target.value)}
                  placeholder="Describe job responsibilities and qualifications..."
                />
              </div>

            </div>

            <button
              className="primary-button"
              type="submit"
              disabled={loadingJob}
            >
              {loadingJob ? "Creating Job..." : "Create Job →"}
            </button>

          </form>

          {jobs.length > 0 && (
            <div className="form-group" style={{ marginTop: 22 }}>
              <label>Select Existing Job</label>

              <select
                value={jobId}
                onChange={(event) => {
                  const selectedId = event.target.value;

                  setJobId(selectedId);
                  setResults([]);
                  loadHistory(selectedId);
                }}
              >
                {jobs.map((job) => (
                  <option key={job.job_id} value={job.job_id}>
                    {job.job_title}
                  </option>
                ))}
              </select>
            </div>
          )}

        </section>

        {/* Resume Upload */}
        <section className="section-card" id="upload-section">

          <div className="section-heading">
            <div>
              <p className="section-tag">STEP 02</p>
              <h2>Upload Candidate Resumes</h2>
              <p>Upload multiple PDF resumes for AI analysis.</p>
            </div>
          </div>

          <div className="upload-area">
            <h3>Upload your resumes</h3>
            <p>Select PDF files from your computer.</p>

            <label htmlFor="resume-upload" className="upload-button">
              + Choose PDF Files
            </label>

            <input
              id="resume-upload"
              type="file"
              accept=".pdf,application/pdf"
              multiple
              hidden
              onChange={handleFileChange}
            />
          </div>

          {files.map((file, index) => (
            <div
              className="file-item"
              key={`${file.name}-${index}`}
            >
              <span>
                📄 {file.name} ({(file.size / 1024).toFixed(1)} KB)
              </span>

              <button
                type="button"
                className="remove-button"
                onClick={() => removeFile(index)}
              >
                ✕
              </button>
            </div>
          ))}

          <button
            className="primary-button analyze-button"
            type="button"
            onClick={handleScreening}
            disabled={
              loadingScreening ||
              files.length === 0 ||
              !jobId
            }
          >
            {loadingScreening
              ? "Analyzing Resumes..."
              : `Analyze & Rank ${files.length} Candidates →`}
          </button>

        </section>

        {/* Candidate Rankings */}
        <section className="section-card" id="results-section">

          <div className="section-heading">
            <div>
              <p className="section-tag">STEP 03</p>
              <h2>Candidate Rankings</h2>
              <p>Compare candidate scores and skills.</p>
            </div>
          </div>

          {results.length === 0 ? (
            <div className="empty-state">
              <h3>No candidates analyzed yet</h3>
              <p>Upload resumes to view candidate rankings.</p>
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
                    <th>Score</th>
                  </tr>
                </thead>

                <tbody>
                  {results.map((candidate, index) => (
                    <tr key={candidate.candidate_id || index}>
                      <td>
                        <span className="rank-badge">
                          #{candidate.rank || index + 1}
                        </span>
                      </td>

                      <td>
                        {candidate.candidate_details?.name || "Unknown"}
                      </td>

                      <td>
                        {candidate.candidate_details?.email || "Not available"}
                      </td>

                      <td>
                        {candidate.candidate_details?.experience_years ?? 0} years
                      </td>

                      <td>
                        {candidate.required_skill_score ?? 0}%
                      </td>

                      <td>
                        <strong>
                          {candidate.score ?? candidate.final_score ?? 0}%
                        </strong>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

            </div>
          )}

        </section>

        {/* Screening History */}
        <section className="section-card" id="history-section">

          <div className="section-heading">

            <div>
              <p className="section-tag">DATABASE RECORDS</p>
              <h2>Screening History</h2>
              <p>Previously screened candidates.</p>
            </div>

            <button
              className="clear-button"
              onClick={() => loadHistory(jobId)}
              disabled={loadingHistory}
            >
              {loadingHistory ? "Loading..." : "↻ Refresh"}
            </button>

          </div>

          {history.length === 0 ? (
            <div className="empty-state">
              <h3>No screening history found</h3>
              <p>
                Your previous candidate screenings will appear here.
              </p>
            </div>
          ) : (
            <div className="table-wrapper">

              <table>
                <thead>
                  <tr>
                    <th>Candidate</th>
                    <th>Email</th>
                    <th>Job Title</th>
                    <th>Score</th>
                    <th>Screening Date</th>
                  </tr>
                </thead>

                <tbody>
                  {history.map((item) => (
                    <tr key={item.screening_id}>
                      <td>{item.candidate_name}</td>
                      <td>{item.email || "Not available"}</td>
                      <td>{item.job_title}</td>
                      <td>{item.final_score}%</td>
                      <td>
                        {item.screening_date
                          ? new Date(item.screening_date).toLocaleString()
                          : "Not available"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

            </div>
          )}

        </section>

        {message && (
          <div
            className="message-box"
            role="status"
            aria-live="polite"
          >
            {message}
          </div>
        )}

        <footer>
          <p>
            HireAI © 2026 | AI-Powered Resume Screening System
          </p>
        </footer>

      </main>
    </div>
  );
}

export default App;
