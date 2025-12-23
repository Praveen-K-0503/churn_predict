import React from 'react'
import { Link } from 'react-router-dom'
import { 
  Brain, Upload, BarChart3, Target, Zap, Database, 
  TrendingUp, Shield, Cpu, LineChart, Activity, Users 
} from 'lucide-react'

const Home = () => {
  const features = [
    {
      icon: Brain,
      title: "AI-Powered Analysis",
      description: "Advanced ML with 97% accuracy using XGBoost, Random Forest, and ensemble methods",
      color: "bg-blue-500",
      link: "/train"
    },
    {
      icon: Upload,
      title: "Smart Data Upload",
      description: "Drag & drop any dataset - AI automatically analyzes and prepares data",
      color: "bg-green-500",
      link: "/upload"
    },
    {
      icon: BarChart3,
      title: "Power BI-Style Analytics",
      description: "Interactive dashboards with 20+ chart types and real-time filtering",
      color: "bg-purple-500",
      link: "/analytics"
    },
    {
      icon: Target,
      title: "Predictive Modeling",
      description: "Real-time predictions with SHAP explanations and confidence scores",
      color: "bg-red-500",
      link: "/predict"
    },
    {
      icon: Activity,
      title: "Real-Time Monitoring",
      description: "Live equipment monitoring with predictive maintenance alerts",
      color: "bg-orange-500",
      link: "/monitoring"
    },
    {
      icon: Database,
      title: "Dynamic Learning",
      description: "Models continuously learn from new data, improving accuracy over time",
      color: "bg-indigo-500",
      link: "/dashboard"
    }
  ]

  const stats = [
    { label: "ML Accuracy", value: "97%", icon: Brain },
    { label: "Equipment Data", value: "15+", icon: Database },
    { label: "Chart Types", value: "20+", icon: BarChart3 },
    { label: "Processing Speed", value: "<1s", icon: Zap }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-6 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-800 mb-6">
            ChurnGuard AI Platform
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Enterprise-grade AI platform for customer churn prediction with dynamic learning, 
            real-time analytics, and automated model training. Upload any dataset and get 
            instant insights with Power BI-style visualizations.
          </p>
          
          <div className="flex flex-wrap justify-center gap-4">
            <Link 
              to="/upload" 
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2"
            >
              <Upload className="w-5 h-5" />
              <span>Upload Dataset</span>
            </Link>
            <Link 
              to="/dashboard" 
              className="bg-white hover:bg-gray-50 text-gray-800 px-8 py-3 rounded-lg font-medium border border-gray-300 transition-colors flex items-center space-x-2"
            >
              <BarChart3 className="w-5 h-5" />
              <span>View Dashboard</span>
            </Link>
            <Link 
              to="/predict" 
              className="bg-green-500 hover:bg-green-600 text-white px-8 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2"
            >
              <Target className="w-5 h-5" />
              <span>Try Prediction</span>
            </Link>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white rounded-lg p-6 text-center shadow-lg">
              <stat.icon className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-800">{stat.value}</div>
              <div className="text-sm text-gray-600">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {features.map((feature, index) => (
            <Link
              key={index}
              to={feature.link}
              className="bg-white rounded-lg p-6 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1"
            >
              <div className={`w-12 h-12 ${feature.color} rounded-lg flex items-center justify-center mb-4`}>
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </Link>
          ))}
        </div>

        {/* How It Works */}
        <div className="bg-white rounded-lg p-8 shadow-lg mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">How It Works</h2>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Upload className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">1. Upload Data</h3>
              <p className="text-sm text-gray-600">Drag & drop any CSV file. AI automatically detects data types and structure.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Cpu className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">2. AI Processing</h3>
              <p className="text-sm text-gray-600">Automated data cleaning, feature engineering, and model selection.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <LineChart className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">3. Analytics</h3>
              <p className="text-sm text-gray-600">Interactive dashboards with advanced visualizations and insights.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">4. Predictions</h3>
              <p className="text-sm text-gray-600">Real-time predictions with explanations and confidence scores.</p>
            </div>
          </div>
        </div>

        {/* Technical Specifications */}
        <div className="bg-gray-800 rounded-lg p-8 text-white">
          <h2 className="text-3xl font-bold text-center mb-8">Technical Specifications</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-xl font-semibold mb-4 flex items-center">
                <Brain className="w-6 h-6 mr-2" />
                Machine Learning
              </h3>
              <ul className="space-y-2 text-gray-300">
                <li>• XGBoost (97% F1 Score)</li>
                <li>• Random Forest</li>
                <li>• Logistic Regression</li>
                <li>• SVM & Ensemble Methods</li>
                <li>• SHAP Explanations</li>
                <li>• Auto-hyperparameter tuning</li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-4 flex items-center">
                <Activity className="w-6 h-6 mr-2" />
                Analytics Features
              </h3>
              <ul className="space-y-2 text-gray-300">
                <li>• 20+ Chart Types</li>
                <li>• Real-time Filtering</li>
                <li>• Drill-down Analysis</li>
                <li>• Export (CSV/PDF)</li>
                <li>• Interactive Dashboards</li>
                <li>• Custom Visualizations</li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-4 flex items-center">
                <Shield className="w-6 h-6 mr-2" />
                Platform Features
              </h3>
              <ul className="space-y-2 text-gray-300">
                <li>• Real-time Processing</li>
                <li>• Dynamic Learning</li>
                <li>• Auto Data Cleaning</li>
                <li>• Scalable Architecture</li>
                <li>• REST API</li>
                <li>• Production Ready</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Home