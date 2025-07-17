import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Download, FileText, Calendar, TestTube, AlertCircle, Clock } from "lucide-react";
import BackButton from "@/components/BackButton";

interface TestResult {
  _id: string;
  patientId: {
    _id: string;
    name: string;
    email: string;
  };
  testId: {
    _id: string;
    name: string;
    category: string;
  };
  diagnosticCenterId: {
    _id: string;
    name: string;
  };
  appointmentDate: string;
  appointmentTime: string;
  status: string;
  results?: {
    reportUrl?: string;
    summary?: string;
    uploadedAt?: string;
  };
}

const UserTestResults = () => {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchTestResults();
  }, []);

  const fetchTestResults = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/appointments/my-results', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        const resultsData = result.appointments || result.data || [];
        setTestResults(resultsData);
      } else {
        toast({
          title: "Error",
          description: "Failed to load test results",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Fetch test results error:', error);
      toast({
        title: "Error",
        description: "Failed to fetch test results",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadResult = async (resultUrl: string, testName: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(resultUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${testName}_results.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        toast({
          title: "Success",
          description: "Test result downloaded successfully",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to download test result",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Error",
        description: "An error occurred while downloading the result",
        variant: "destructive",
      });
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return 'default';
      case 'confirmed': return 'secondary';
      case 'scheduled': return 'outline';
      default: return 'outline';
    }
  };

  const hasResults = (testResult: TestResult) => {
    return testResult.results?.reportUrl || testResult.results?.summary;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <BackButton />
        </div>

        <div className="max-w-4xl mx-auto">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-6 w-6" />
                My Test Results
              </CardTitle>
              <CardDescription>
                View and download your diagnostic test results
              </CardDescription>
            </CardHeader>
          </Card>

          {testResults.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="font-semibold mb-2">No Test Results Available</h3>
                <p className="text-muted-foreground">
                  You don't have any test results yet. Results will appear here once your tests are completed and processed.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {testResults.map((testResult) => (
                <Card key={testResult._id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <TestTube className="h-5 w-5 text-primary" />
                          <h3 className="text-lg font-semibold">{testResult.testId.name}</h3>
                          <Badge variant="secondary">{testResult.testId.category}</Badge>
                          <Badge variant={getStatusBadgeVariant(testResult.status)}>
                            {testResult.status.toUpperCase()}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground mb-4">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>
                              Test Date: {new Date(testResult.appointmentDate).toLocaleDateString()} at {testResult.appointmentTime}
                            </span>
                          </div>
                          <div>
                            <span>Center: {testResult.diagnosticCenterId.name}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {hasResults(testResult) ? (
                      <div className="bg-muted rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-medium mb-2 flex items-center gap-2">
                              <FileText className="h-4 w-4" />
                              Test Results Available
                            </h4>
                            
                            {testResult.results?.summary && (
                              <div className="mb-3">
                                <h5 className="font-medium text-sm mb-1">Summary:</h5>
                                <p className="text-sm">{testResult.results.summary}</p>
                              </div>
                            )}
                            
                            {testResult.results?.uploadedAt && (
                              <p className="text-xs text-muted-foreground">
                                Results uploaded: {new Date(testResult.results.uploadedAt).toLocaleString()}
                              </p>
                            )}
                          </div>
                          
                          {testResult.results?.reportUrl && (
                            <Button
                              onClick={() => handleDownloadResult(testResult.results!.reportUrl!, testResult.testId.name)}
                              size="sm"
                              className="ml-4"
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Download Report
                            </Button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 text-yellow-800">
                          <Clock className="h-4 w-4" />
                          <span className="font-medium">Results Not Yet Available</span>
                        </div>
                        <p className="text-sm text-yellow-700 mt-1">
                          Your test results are being processed. You will be notified once they are ready.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserTestResults;