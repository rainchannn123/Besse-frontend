'use client';

import React, { useState } from 'react';
import { X, Upload, FileText, CheckCircle, XCircle, Loader2 } from 'lucide-react';

interface StudentRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface CSVStudent {
  courseName: string;
  role: string;
  name: string;
  eid: string;
  email: string;
}

interface RegistrationResult {
  name: string;
  email: string;
  status: 'success' | 'failed';
  error?: string;
}

const StudentRegistrationModal: React.FC<StudentRegistrationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [students, setStudents] = useState<CSVStudent[]>([]);
  const [results, setResults] = useState<RegistrationResult[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState<'upload' | 'review' | 'results'>('upload');
    const [dragActive, setDragActive] = useState(false);
  const [textareaContent, setTextareaContent] = useState('');

  const sampleCSV = `Course Name,Role,Student Name,EID,Email
SLC1005,Student,CHAN Tai Man,tmchan123,tchan1@test.com
SFE1005,Student,LEE Ming Fung,mflee123,mflee@test.com`;

  const handleCopySampleCSV = async () => {
    try {
      await navigator.clipboard.writeText(sampleCSV);
    } catch (error) {
      console.error('Failed to copy sample CSV:', error);
    }
  };

  if (!isOpen) return null;


  const parseCSV = (content: string): CSVStudent[] => {
    const lines = content.trim().split('\n');
    
    const parsedStudents: CSVStudent[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      // Split by comma (handles values with quotes)
      const values: string[] = [];
      let currentValue = '';
      let inQuotes = false;
      
      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(currentValue.trim());
          currentValue = '';
        } else {
          currentValue += char;
        }
      }
      values.push(currentValue.trim());
      
      if (values.length >= 5 && values.some(v => v.length > 0)) {
        parsedStudents.push({
          courseName: values[0],
          role: values[1],
          name: values[2],           // Student Name
          eid: values[3],            // EID (used as password)
          email: values[4],          // Email
        });
      }
    }

    return parsedStudents;
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        const parsed = parseCSV(content);
        setStudents(parsed);
        setStep('review');
      };
      reader.readAsText(file, 'UTF-8');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type === 'text/csv') {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        const parsed = parseCSV(content);
        setStudents(parsed);
        setStep('review');
      };
      reader.readAsText(file, 'UTF-8');
    }
  };

    const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTextareaContent(e.target.value);
  };

  const handleTextareaSubmit = () => {
    if (textareaContent && textareaContent.trim()) {
      const parsed = parseCSV(textareaContent);
      setStudents(parsed);
      setStep('review');
    }
  };


  const handleRegisterAll = async () => {
    setIsProcessing(true);
    
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    const registerPromises = students.map(async (student) => {
      try {
        // Convert role from CSV to accountType
        let accountType = 'student';
        const roleLower = student.role.toLowerCase();
        if (roleLower === 'educator') {
          accountType = 'educator';
        } else if (roleLower === 'spectator') {
          accountType = 'spectator';
        } else if (roleLower === 'admin') {
          accountType = 'admin';
        } else {
          accountType = 'student';
        }

        const response = await fetch(`${API_URL}/auth/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: student.name,
            email: student.email,
            password: student.eid,
            accountType: accountType,
          }),
        });
        
        const data = await response.json();
        
        if (data.success) {
          return {
            name: student.name,
            email: student.email,
            status: 'success' as const,
          };
        } else {
          let errorMsg = data.message || 'Registration failed';
          if (errorMsg.includes('already exists')) {
            errorMsg = 'Email already registered';
          }
          return {
            name: student.name,
            email: student.email,
            status: 'failed' as const,
            error: errorMsg,
          };
        }
      } catch (error: any) {
        let errorMsg = error.message || 'Unknown error';
        if (errorMsg.includes('already exists') || errorMsg.includes('duplicate')) {
          errorMsg = 'Email already registered';
        }
        return {
          name: student.name,
          email: student.email,
          status: 'failed' as const,
          error: errorMsg,
        };
      }
    });

    const allResults = await Promise.all(registerPromises);
    setResults(allResults);
    setStep('results');
    setIsProcessing(false);
    
    if (onSuccess && allResults.some(r => r.status === 'success')) {
      onSuccess();
    }
  };

    const handleReset = () => {
    setStudents([]);
    setResults([]);
    setStep('upload');
    setIsProcessing(false);
    setTextareaContent('');
  };


  const successCount = results.filter(r => r.status === 'success').length;
  const failedCount = results.filter(r => r.status === 'failed').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-[#50704C] text-white rounded-t-xl">
          <h2 className="text-xl font-bold">Register Students</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/20 rounded transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {step === 'upload' && (
            <div>
              <p className="text-gray-600 mb-4">
                Upload a CSV file with student information. The CSV should have the following columns:
              </p>
              <div className="bg-gray-100 p-3 rounded-md mb-4 text-sm font-mono">
                Course Name, Role, Student Name, EID, Email
              </div>
              <p className="text-gray-500 text-sm mb-4">
                Example: SLC1005, Student, CHAN Tai Man, tmchan123, tchan1@test.com
              </p>
              
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive
                    ? 'border-[#3A7D2C] bg-green-50'
                    : 'border-gray-300 hover:border-[#50704C]'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-600 mb-2">
                  Drag and drop a CSV file here, or click to select
                </p>
                <p className="text-gray-400 text-sm mb-4">
                  Or paste CSV content below
                </p>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="csv-upload"
                />
                <label
                  htmlFor="csv-upload"
                  className="inline-block px-4 py-2 bg-[#50704C] text-white rounded-md cursor-pointer hover:bg-[#3A7D2C] transition-colors"
                >
                  Select CSV File
                </label>
              </div>

              <div className="mt-4">
                                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Or paste CSV content:
                  </label>
                  <button
                    type="button"
                    onClick={handleCopySampleCSV}
                    className="text-sm text-[#50704C] hover:underline"
                  >
                    Copy sample format
                  </button>
                </div>
                <textarea
                  rows={6}
                  className="w-full border border-gray-300 rounded-md p-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#50704C]"
                  placeholder="Paste your CSV content here"
                  value={textareaContent}
                  onChange={handleTextareaChange}
                ></textarea>

                <button
                  type="button"
                  onClick={handleTextareaSubmit}
                  disabled={!textareaContent.trim()}
                  className="mt-3 px-4 py-2 bg-[#50704C] text-white rounded-md hover:bg-[#3A7D2C] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Submit Registration
                </button>

              </div>
            </div>
          )}

          {step === 'review' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-lg">Review Students ({students.length})</h3>
                <button
                  onClick={handleReset}
                  className="text-sm text-[#50704C] hover:underline"
                >
                  Upload different file
                </button>
              </div>
              
              {students.length === 0 ? (
                <div className="text-center py-8 text-red-500">
                  No students found in CSV. Please check the format.
                </div>
              ) : (
                <div className="overflow-x-auto max-h-96 border rounded-md">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-4 py-2 text-left">Student Name</th>
                        <th className="px-4 py-2 text-left">Email</th>
                        <th className="px-4 py-2 text-left">Account Type</th>
                        <th className="px-4 py-2 text-left">Password (EID)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((student, index) => (
                        <tr key={index} className="border-t">
                          <td className="px-4 py-2">{student.name}</td>
                          <td className="px-4 py-2">{student.email}</td>
                          <td className="px-4 py-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              student.role.toLowerCase() === 'educator' ? 'bg-purple-100 text-purple-800' :
                              student.role.toLowerCase() === 'spectator' ? 'bg-yellow-100 text-yellow-800' :
                              student.role.toLowerCase() === 'admin' ? 'bg-red-100 text-red-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {student.role || 'student'}
                            </span>
                           </td>
                          <td className="px-4 py-2 font-mono">{student.eid}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="mt-4 p-3 bg-yellow-50 rounded-md border border-yellow-200">
                <p className="text-sm text-yellow-800">
                  ⚠️ Students with existing emails will be skipped and shown as failed.
                </p>
              </div>
            </div>
          )}

          {step === 'results' && (
            <div>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-green-50 p-4 rounded-lg text-center border border-green-200">
                  <CheckCircle className="mx-auto h-8 w-8 text-green-600 mb-2" />
                  <p className="text-2xl font-bold text-green-600">{successCount}</p>
                  <p className="text-sm text-green-700">Successfully Registered</p>
                </div>
                <div className="bg-red-50 p-4 rounded-lg text-center border border-red-200">
                  <XCircle className="mx-auto h-8 w-8 text-red-600 mb-2" />
                  <p className="text-2xl font-bold text-red-600">{failedCount}</p>
                  <p className="text-sm text-red-700">Failed</p>
                </div>
              </div>

              {failedCount > 0 && (
                <div className="overflow-x-auto max-h-64 border rounded-md">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-4 py-2 text-left">Student Name</th>
                        <th className="px-4 py-2 text-left">Email</th>
                        <th className="px-4 py-2 text-left">Error</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.filter(r => r.status === 'failed').map((result, index) => (
                        <tr key={index} className="border-t">
                          <td className="px-4 py-2">{result.name}</td>
                          <td className="px-4 py-2">{result.email}</td>
                          <td className="px-4 py-2 text-red-600">{result.error}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-md transition-colors"
          >
            Close
          </button>
          
          {step === 'review' && students.length > 0 && (
            <button
              onClick={handleRegisterAll}
              disabled={isProcessing}
              className="px-4 py-2 bg-[#50704C] text-white rounded-md hover:bg-[#3A7D2C] transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Registering...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4" />
                  Register All ({students.length})
                </>
              )}
            </button>
          )}
          
          {step === 'results' && (
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-[#50704C] text-white rounded-md hover:bg-[#3A7D2C] transition-colors"
            >
              Register More
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentRegistrationModal;