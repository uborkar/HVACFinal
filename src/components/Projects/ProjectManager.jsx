import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { flatDatabaseService } from '../../services/flatDatabaseService';
import { useToast } from '../ui/toast';
import { Link } from 'react-router-dom';
import './ProjectManager.css';

const ProjectManager = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('updatedAt');
  const [sortOrder, setSortOrder] = useState('desc');

  const loadUserProjects = useCallback(async () => {
    if (!user) {
      setProjects([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('🔄 Loading projects for user:', user.uid);
      
      const userProjects = await flatDatabaseService.getUserProjects(user.uid);
      console.log('✅ Loaded projects:', userProjects.length);
      
      setProjects(userProjects);
    } catch (error) {
      console.error('❌ Error loading projects:', error);
      setProjects([]);
      toast.error('Failed to load projects. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    if (user) {
      loadUserProjects();
    } else {
      setProjects([]);
      setLoading(false);
    }
  }, [user, loadUserProjects]);

  const deleteProject = async (projectId) => {
    if (!user) return;
    
    if (window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      try {
        await flatDatabaseService.deleteProject(projectId, user.uid);
        setProjects(projects.filter(p => (p.id || p.projectId) !== projectId));
        toast.success('Project deleted successfully!');
      } catch (error) {
        console.error('Error deleting project:', error);
        toast.error('Failed to delete project. Please try again.');
      }
    }
  };

  const duplicateProject = async (project) => {
    if (!user) return;
    
    try {
      const newProjectId = Date.now().toString();
      const newProjectNumber = `${project.meta?.projectNumber || 'PRJ'}-COPY-${Date.now()}`;
      const newProjectName = `${project.meta?.projectName || 'Project'} (Copy)`;
      
      // Create a copy of the project data
      const duplicatedProject = {
        ...project,
        designData: {
          ...project.designData,
          meta: {
            ...project.designData?.meta,
            projectNumber: newProjectNumber,
            projectName: newProjectName
          }
        },
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        userId: user.uid
      };
      
      // Save using flatDatabaseService
      await flatDatabaseService.createProject(user.uid, newProjectId, duplicatedProject);
      
      // Reload projects to show the duplicate
      await loadUserProjects();
      toast.success('Project duplicated successfully!');
    } catch (error) {
      console.error('Error duplicating project:', error);
      toast.error('Failed to duplicate project. Please try again.');
    }
  };

  const filteredProjects = projects
    .filter(project => {
      const projectName = project.designData?.meta?.projectName || project.meta?.projectName || '';
      const projectNumber = project.designData?.meta?.projectNumber || project.meta?.projectNumber || '';
      const address = project.designData?.meta?.address || project.meta?.address || '';
      
      return projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
             projectNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
             address.toLowerCase().includes(searchTerm.toLowerCase());
    })
    .sort((a, b) => {
      let aValue = a[sortBy] || a.designData?.meta?.[sortBy] || a.meta?.[sortBy] || '';
      let bValue = b[sortBy] || b.designData?.meta?.[sortBy] || b.meta?.[sortBy] || '';
      
      if (sortBy === 'savedAt' || sortBy === 'updatedAt' || sortBy === 'createdAt') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  const getProjectStatus = (project) => {
    const steps = [
      { key: 'designData', oldKey: 'meta', label: 'Design Inputs', value: 1 },
      { key: 'spaceData', label: 'Space Calculated', value: 2 },
      { key: 'equipmentData', label: 'Equipment Selected', value: 3 },
      { key: 'inventoryData', label: 'Inventory Added', value: 4 },
      { key: 'boqData', oldKey: 'boq', label: 'BOQ Complete', value: 5 }
    ];

    let completedSteps = 0;
    let currentLabel = 'Not Started';

    for (const step of steps) {
      // Check both new key and old key for backward compatibility
      if (project[step.key] || (step.oldKey && project[step.oldKey])) {
        completedSteps = step.value;
        currentLabel = step.label;
      }
    }

    // Get room calculation details
    const spaceData = project.spaceData || {};
    const roomCalculations = spaceData.roomCalculations || {};
    const buildingData = spaceData.buildingData || {};
    const totalRooms = buildingData.floors ? 
      buildingData.floors.reduce((total, floor) => total + (floor.rooms?.length || 0), 0) : 0;
    const calculatedRooms = Object.keys(roomCalculations).length;
    
    // Calculate building totals
    const buildingTotals = Object.values(roomCalculations).reduce((totals, calc) => {
      const heatData = calc.heatLoadData || {};
      return {
        totalArea: totals.totalArea + (heatData.area || 0),
        totalTons: totals.totalTons + (heatData.tonnage || 0),
        totalCFM: totals.totalCFM + (heatData.totalCfm || 0)
      };
    }, { totalArea: 0, totalTons: 0, totalCFM: 0 });

    return {
      label: currentLabel,
      progress: (completedSteps / 5) * 100,
      completedSteps,
      totalSteps: 5,
      // Room calculation details
      totalRooms,
      calculatedRooms,
      roomCompletionPercentage: totalRooms > 0 ? (calculatedRooms / totalRooms) * 100 : 0,
      // Building totals
      ...buildingTotals
    };
  };

  const getStatusColor = (progress) => {
    if (progress === 100) return '#10b981'; // Green - Completed
    if (progress >= 60) return '#3b82f6'; // Blue - Good progress
    if (progress >= 40) return '#8b5cf6'; // Purple - Medium progress
    if (progress >= 20) return '#f59e0b'; // Orange - Started
    return '#ef4444'; // Red - Just started
  };

  const getTimeAgo = (dateString) => {
    if (!dateString) return 'Unknown';
    
    const now = new Date();
    const date = new Date(dateString);
    const seconds = Math.floor((now - date) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  if (!user) {
    return (
      <div className="project-manager">
        <div className="no-auth">
          <i className="bi bi-shield-lock"></i>
          <h3>Authentication Required</h3>
          <p>Please sign in to view your projects</p>
          <Link to="/login" className="auth-btn">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="project-manager">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading your projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="project-manager">
      <div className="project-header">
        <div className="header-content">
          <h1>Project Manager</h1>
          <p>Manage your HVAC calculation projects</p>
          <div className="user-info">
            <span>Welcome, {user.displayName || user.email}</span>
          </div>
        </div>
        <div className="header-actions">
          <Link to="/calculator" className="new-project-btn">
            <i className="bi bi-plus-circle"></i>
            New Project
          </Link>
        </div>
      </div>


      <div className="project-controls">
        <div className="search-container">
          <i className="bi bi-search"></i>
          <input
            type="text"
            placeholder="Search projects by name, number, or address..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="sort-controls">
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
            className="sort-select"
          >
            <option value="updatedAt">Last Modified</option>
            <option value="createdAt">Created Date</option>
            <option value="projectName">Project Name</option>
            <option value="projectNumber">Project Number</option>
          </select>
          <button 
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="sort-order-btn"
          >
            <i className={`bi bi-sort-${sortOrder === 'asc' ? 'up' : 'down'}`}></i>
          </button>
        </div>
      </div>

      <div className="projects-grid">
        {filteredProjects.length === 0 ? (
          <div className="no-projects">
            <i className="bi bi-folder-x"></i>
            <h3>No projects found</h3>
            <p>
              {searchTerm 
                ? 'No projects match your search criteria.' 
                : 'Start by creating your first HVAC calculation project.'
              }
            </p>
            <Link to="/calculator" className="create-first-btn">
              Create First Project
            </Link>
          </div>
        ) : (
          filteredProjects.map((project) => {
            const status = getProjectStatus(project);
            const statusColor = getStatusColor(status.progress);
            
            return (
              <div key={project.id || project.projectId} className="project-card">
                <div className="project-card-header">
                  <div className="project-info">
                    <h3>{project.designData?.meta?.projectName || project.meta?.projectName || 'Untitled Project'}</h3>
                    <p className="project-number">#{project.designData?.meta?.projectNumber || project.meta?.projectNumber || project.id}</p>
                  </div>
                  <div className="project-status-badge" style={{ '--status-color': statusColor }}>
                    <span className="status-dot"></span>
                    {status.label}
                  </div>
                </div>

                <div className="project-progress">
                  <div className="progress-info">
                    <span className="progress-label">Progress</span>
                    <span className="progress-percentage">{Math.round(status.progress)}%</span>
                  </div>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ 
                        width: `${status.progress}%`,
                        backgroundColor: statusColor
                      }}
                    ></div>
                  </div>
                  <div className="progress-steps">
                    <span>{status.completedSteps} of {status.totalSteps} steps completed</span>
                  </div>
                </div>

                <div className="project-details">
                  <div className="detail-item">
                    <i className="bi bi-geo-alt-fill"></i>
                    <span>{project.designData?.meta?.address || project.meta?.address || 'No address specified'}</span>
                  </div>
                  <div className="detail-item">
                    <i className="bi bi-person-fill"></i>
                    <span>{project.designData?.meta?.estimatedBy || project.meta?.estimatedBy || 'Unknown'}</span>
                  </div>
                  <div className="detail-item">
                    <i className="bi bi-clock-fill"></i>
                    <span>{getTimeAgo(project.lastUpdated || project.updatedAt || project.designData?.meta?.savedAt || project.meta?.savedAt)}</span>
                  </div>
                  {(project.designData?.meta?.buildingType || project.meta?.buildingType) && (
                    <div className="detail-item">
                      <i className="bi bi-building-fill"></i>
                      <span>{project.designData?.meta?.buildingType || project.meta?.buildingType}</span>
                    </div>
                  )}
                </div>

                <div className="project-actions">
                  <Link 
                    to={`/calculator?project=${project.id || project.projectId}`} 
                    className="action-btn primary"
                    title="Open Project"
                  >
                    <i className="bi bi-folder-open"></i>
                    Open
                  </Link>
                  <button 
                    onClick={() => duplicateProject(project)}
                    className="action-btn secondary"
                    title="Duplicate Project"
                  >
                    <i className="bi bi-files"></i>
                    Copy
                  </button>
                  <button 
                    onClick={() => deleteProject(project.id || project.projectId)}
                    className="action-btn danger"
                    title="Delete Project"
                  >
                    <i className="bi bi-trash"></i>
                    Delete
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="project-stats">
        <div className="stat-item">
          <div className="stat-icon">
            <i className="bi bi-folder-fill"></i>
          </div>
          <div className="stat-content">
            <span className="stat-number">{projects.length}</span>
            <span className="stat-label">Total Projects</span>
          </div>
        </div>
        <div className="stat-item">
          <div className="stat-icon completed">
            <i className="bi bi-check-circle-fill"></i>
          </div>
          <div className="stat-content">
            <span className="stat-number">
              {projects.filter(p => getProjectStatus(p).progress === 100).length}
            </span>
            <span className="stat-label">Completed</span>
          </div>
        </div>
        <div className="stat-item">
          <div className="stat-icon in-progress">
            <i className="bi bi-hourglass-split"></i>
          </div>
          <div className="stat-content">
            <span className="stat-number">
              {projects.filter(p => getProjectStatus(p).progress > 0 && getProjectStatus(p).progress < 100).length}
            </span>
            <span className="stat-label">In Progress</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectManager;