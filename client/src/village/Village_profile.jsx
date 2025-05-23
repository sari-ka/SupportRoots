import { useEffect, useState, useContext } from "react";
import axios from "axios";
import { villageContext } from "../Context/LoginV_Context";
import 'bootstrap/dist/css/bootstrap.min.css';

const VillageProfile = () => {
  const { currentVillage } = useContext(villageContext);
  const [villageDetails, setVillageDetails] = useState(null);
  const [topTrusts, setTopTrusts] = useState([]);
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalProjects, setModalProjects] = useState([]);
  const [modalTitle, setModalTitle] = useState("");
  const [trustNames, setTrustNames] = useState({});
  const [problemSummary, setProblemSummary] = useState({
    pending: 0,
    ongoing: 0,
    upcoming: 0,
    past: 0,
    all: 0
  });
  const [acceptedProblems, setAcceptedProblems] = useState([]);

  const MAPS_API_KEY = "AIzaSyABCDEFGHIJKLMNOPQRSTUVWXYZ12345678"; // Replace with your actual key

  const villageId = currentVillage || localStorage.getItem("villageId");
  const fetchTrustName = async (trustId) => {
    if (!trustId) return;
  
    try {
      const response = await axios.get(`http://localhost:9125/village-api/trust/${trustId}`);
      console.log(response)
      const trustName = response.data.trust_name;
      setTrustNames(prev => ({ ...prev, [trustId]: trustName }));
    } catch (error) {
      console.log(`Error fetching trust name for ID ${trustId}:`, error);
      setTrustNames(prev => ({ ...prev, [trustId]: "Unknown Trust" }));
    }
  };
   
  const handleProjectClick = async (projectType) => {
    setModalTitle(`${projectType.charAt(0).toUpperCase() + projectType.slice(1)} Projects`);
    
    try {
      setLoading(true);
      
      if (projectType === 'accepted') {
        // Special API call for accepted projects with trust info
        const res = await axios.get(
          `http://localhost:9125/village-api/village/${villageDetails.name}/problems/accepted-with-village`
        );
        setModalProjects(res.data.payload || []);
      } else {
        // Regular filtering for other project types
        setModalProjects(villageDetails?.problems.filter(p => p.status === projectType) || []);
      }
      
      setShowModal(true);
    } catch (err) {
      setError(err.message);
      // Fallback to regular projects if API fails
      setModalProjects(villageDetails?.problems.filter(p => p.status === projectType) || []);
      setShowModal(true);
    } finally {
      setLoading(false);
    }
  };

  const getVillage = async () => {
    if (!villageId) {
      setError("No village selected");
      return;
    }

    try {
      setLoading(true);
      const res = await axios.get(`http://localhost:9125/village-api/village/${villageId}`);
      if (res.data.payload) {
        const villageData = res.data.payload;
        setVillageDetails(villageData);

        const summary = {
          pending: villageData.problems.filter(p => p.status === "pending").length,
          ongoing: villageData.problems.filter(p => p.status === "ongoing").length,
          upcoming: villageData.problems.filter(p => p.status === "upcoming").length,
          past: villageData.problems.filter(p => p.status === "past").length,
          all: villageData.problems.length
        };
        setProblemSummary(summary);

        localStorage.setItem("villageData", JSON.stringify(villageData));
      } else {
        throw new Error("No village data found");
      }
    } catch (err) {
      setError(err.message);
      const cached = localStorage.getItem("villageData");
      if (cached) {
        setVillageDetails(JSON.parse(cached));
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchTopTrusts = async () => {
    if (!villageId) return;
  
    try {
      const villageRes = await axios.get(`http://localhost:9125/village-api/village/${villageId}`);
      const villageDetails = villageRes.data.payload;
      const vid = villageDetails._id;
      const res = await axios.get(`http://localhost:9125/village-api/village/${vid}/top-trust`);
      const trusts = res.data.payload || [];

      setTopTrusts(trusts);
      console.log(trusts)
      localStorage.setItem("topTrusts", JSON.stringify(trusts));
    } catch (err) {
      const cacheTrusts = localStorage.getItem("topTrusts");
      if (cacheTrusts) setTopTrusts(JSON.parse(cacheTrusts));
    }
  };
  

  const getVillageImage = async () => {
    if (!villageDetails) return;

    const villageName = villageDetails.name || "Tangeda";
    const state = villageDetails.state || "Andhra Pradesh";
    const pincode = villageDetails.pincode || "522414";

    try {
      const res = await axios.get(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(`${villageName}, ${pincode}, ${state}, India`)}&key=${MAPS_API_KEY}`
      );

      if (res.data.results?.length > 0) {
        const { lat, lng } = res.data.results[0].geometry.location;
        const staticUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=14&size=600x400&maptype=roadmap&markers=color:red%7C${lat},${lng}&key=${MAPS_API_KEY}`;
        setImageUrl(staticUrl);
        localStorage.setItem("villageMap", staticUrl);
      } else throw new Error("Geocoding failed");
    } catch (error) {
      const fallback = localStorage.getItem("villageMap");
      if (fallback) setImageUrl(fallback);
      else {
        setImageUrl(
          `data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='400'%3E%3Crect fill='%23eee' width='600' height='400'/%3E%3Ctext x='50%' y='50%' font-size='24' text-anchor='middle' fill='black'%3E${encodeURIComponent(
            villageName
          )}%3C/text%3E%3C/svg%3E`
        );
      }
    }
  };

  const openGoogleMaps = () => {
    if (!villageDetails) return;

    const villageName = villageDetails.name || "Tangeda";
    const state = villageDetails.state || "Andhra Pradesh";
    const pincode = villageDetails.pincode || "522414";

    const coordMatch = imageUrl.match(/center=([\d.-]+),([\d.-]+)/);
    if (coordMatch) {
      window.open(`https://www.google.com/maps/@${coordMatch[1]},${coordMatch[2]},14z`, "_blank");
    } else {
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${villageName}, ${pincode}, ${state}`)}`, "_blank");
    }
  };

  useEffect(() => {
    const cached = localStorage.getItem("villageData");
    const cachedTrusts = localStorage.getItem("topTrusts");
    const cachedMap = localStorage.getItem("villageMap");

    if (cached) setVillageDetails(JSON.parse(cached));
    if (cachedTrusts) setTopTrusts(JSON.parse(cachedTrusts));
    if (cachedMap) setImageUrl(cachedMap);

    if (villageId) {
      getVillage();
      fetchTopTrusts();
    }
  }, [villageId]);

  useEffect(() => {
    if (villageDetails) {
      getVillageImage();
    }
  }, [villageDetails]);

  useEffect(() => {
    if (villageDetails) {
      getVillageImage();
    }
  }, [villageDetails]);

  useEffect(() => {
    if (showModal && modalProjects.length > 0) {
      modalProjects.forEach(project => {
        if (project.accepted_trust) {
          fetchTrustName(project.accepted_trust);
          console.log(trustNames)
        }
      });
    }
  }, [showModal, modalProjects]);  

  if (!villageId) {
    return <div className="alert alert-danger text-center py-4">No village selected</div>;
  }

  if (loading && !villageDetails) {
    return <div className="text-center py-4"><div className="spinner-border" role="status"><span className="visually-hidden">Loading...</span></div></div>;
  }
  console.log(modalProjects)

  return (
    <div className="container my-4" style={{ maxWidth: '1200px' }}>
      <h2 className="text-center mb-4" style={{ color: '#2c3e50', fontWeight: '600' }}>
        {villageDetails?.name}, {villageDetails?.state}
      </h2>

      <div className="row">
        {/* Left Column (30%) - Village Details, Top Trusts, Top Individuals */}
        <div className="col-md-4">
          {/* Village Details Card */}
          <div className="card mb-4 border-0 shadow-sm">
            <div className="card-body" style={{ backgroundColor: '#f8f9fa', borderRadius: '10px' }}>
              <h4 className="card-title mb-3" style={{ color: '#3498db', borderBottom: '2px solid #3498db', paddingBottom: '8px' }}>
                Village Details
              </h4>
              {imageUrl && (
                <img 
                  src={imageUrl} 
                  alt="Village Map" 
                  className="img-fluid rounded mb-3 shadow" 
                  onClick={openGoogleMaps} 
                  style={{ cursor: "pointer", border: '1px solid #dee2e6' }} 
                />
              )}
              <button 
                className="btn w-100 mb-3"
                onClick={openGoogleMaps}
                style={{ backgroundColor: '#3498db', color: 'white', fontWeight: '500' }}
              >
                Open in Google Maps
              </button>
              <div className="mt-3">
                <p className="mb-2"><strong style={{ color: '#2c3e50' }}>Pincode:</strong> <span style={{ color: '#7f8c8d' }}>{villageDetails?.pincode}</span></p>
                <p className="mb-0"><strong style={{ color: '#2c3e50' }}>Contact:</strong> <span style={{ color: '#7f8c8d' }}>{villageDetails?.contact}</span></p>
              </div>
            </div>
          </div>
          {/* top-trust */}
          <div className="card mb-4 border-0 shadow-sm">
            <div className="card-body" style={{ backgroundColor: '#f8f9fa', borderRadius: '10px' }}>
              <h4 className="card-title mb-3" style={{ color: '#3498db', borderBottom: '2px solid #3498db', paddingBottom: '8px' }}>
                Top Trust Contributors
              </h4>
              <ul className="list-unstyled">
                {topTrusts.map((trust, index) => (
                  <li key={index} className="mb-2">
                    <div style={{ fontSize: '16px', fontWeight: '600', color: '#2c3e50' }}>
                      {trust.rank}. {trust.trust_name}
                    </div>
                    <div className="text-muted" style={{ fontSize: '14px' }}>
                      Total Contribution: ₹{trust.total_money.toLocaleString()}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Right Column (70%) - Projects Summary */}
        <div className="col-md-8">
          <div className="card h-100 border-0 shadow-sm">
            <div className="card-body" style={{ backgroundColor: '#f8f9fa', borderRadius: '10px' }}>
              <h4 className="card-title mb-4" style={{ color: '#3498db', borderBottom: '2px solid #3498db', paddingBottom: '8px' }}>
                Projects Summary
              </h4>
              <div className="row">
                {Object.entries(problemSummary).map(([type, count]) => {
                  if (type === 'all') return null;
                  
                  // Define colors based on project type
                  let cardColor, textColor;
                  switch(type) {
                    case 'pending':
                      cardColor = '#f39c12'; // Orange
                      textColor = 'white';
                      break;
                    case 'ongoing':
                      cardColor = '#3498db'; // Blue
                      textColor = 'white';
                      break;
                    case 'upcoming':
                      cardColor = '#9b59b6'; // Purple
                      textColor = 'white';
                      break;
                    case 'past':
                      cardColor = '#95a5a6'; // Gray
                      textColor = 'white';
                      break;
                    default:
                      cardColor = '#ecf0f1'; // Light gray
                      textColor = '#2c3e50';
                  }
                  
                  return (
                    <div key={type} className="col-md-6 mb-3">
                      <div 
                        className="card clickable-card h-100 border-0 shadow-sm"
                        onClick={() => handleProjectClick(type)}
                        style={{ 
                          cursor: 'pointer',
                          backgroundColor: cardColor,
                          transition: 'transform 0.2s',
                          borderRadius: '10px'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.03)'}
                        onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                      >
                        <div className="card-body text-center py-4">
                          <h5 
                            className="text-capitalize mb-3" 
                            style={{ color: textColor, fontWeight: '500' }}
                          >
                            {type}
                          </h5>
                          <h3 
                            className="display-4 mb-2" 
                            style={{ color: textColor, fontWeight: '600' }}
                          >
                            {count}
                          </h3>
                          <p 
                            className="small mb-0" 
                            style={{ color: textColor, opacity: 0.8 }}
                          >
                            Click to view details
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal for Projects */}
      {showModal && (
  <div className="modal" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
    <div className="modal-dialog modal-lg">
      <div className="modal-content border-0 shadow-lg">
        <div className="modal-header" style={{ backgroundColor: '#3498db', color: 'white' }}>
          <h5 className="modal-title">{modalTitle}</h5>
          <button 
            type="button" 
            className="btn-close btn-close-white" 
            onClick={() => setShowModal(false)}
          ></button>
        </div>
        <div className="modal-body">
          {loading ? (
            <div className="text-center py-4">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : modalProjects.length > 0 ? (
            <div className="list-group">
              {modalProjects.map((project, index) => (
                <div 
                  key={index} 
                  className="list-group-item border-0 mb-2 shadow-sm"
                  style={{ borderRadius: '5px' }}
                >
                  <h5 style={{ color: '#2c3e50' }}>{project.title}</h5>
                  <p style={{ color: '#7f8c8d' }}>{project.description}</p>
                  <div className="d-flex justify-content-between align-items-center">
                    <span style={{ color: '#3498db', fontWeight: '500' }}>
                      Estimated: ₹{project.estimatedamt}
                    </span>
                    <span 
                      className="badge" 
                      style={{ 
                        backgroundColor: 
                          project.status === 'ongoing' ? '#3498db' : 
                          project.status === 'pending' ? '#f39c12' : '#95a5a6',
                        color: 'white'
                      }}
                    >
                      {project.status}
                    </span>
                  </div>
                  {/* Fixed trust name display */}
                  {project.accepted_trust && (
                    <div className="mt-2">
                      <span className="text-muted">Accepted by: </span>
                      <span className="fw-bold" style={{ color: '#2ecc71' }}>
                        {trustNames[project.accepted_trust] || 'Loading...'}
                      </span>
                    </div>
                  )}
                  {project.posted_time && (
                    <small className="text-muted d-block mt-2">
                      Posted: {new Date(project.posted_time).toLocaleString()}
                    </small>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted">No projects found in this category</p>
          )}
        </div>
        <div className="modal-footer">
          <button 
            type="button" 
            className="btn" 
            onClick={() => setShowModal(false)}
            style={{ backgroundColor: '#95a5a6', color: 'white' }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
)}
    </div>
  );
};

export default VillageProfile;