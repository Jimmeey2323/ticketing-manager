import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  FileSpreadsheet,
  Check,
  X,
  Loader2,
  AlertCircle,
  Download,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

interface TrainerFeedbackRecord {
  trainerName: string;
  reviewPeriod: string;
  studio: string;
  totalClassesTaught?: number;
  avgAttendance?: number;
  attendanceGrowth?: string;
  conversionRate?: number;
  emptyClasses?: number;
  meetingAttendance?: string;
  clientFeedback: string;
  internalFeedback: string;
  focusPoints: string;
  goals: string;
  additionalNotes?: string;
  rawData: any;
}

export function TrainerFeedbackBulkUpload() {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<{ success: number; failed: number; records: TrainerFeedbackRecord[] }>({
    success: 0,
    failed: 0,
    records: []
  });
  const { toast } = useToast();

  const parseExcelFile = async (file: File): Promise<TrainerFeedbackRecord | null> => {
    try {
      // This will use the xlsx library when installed
      // For now, we'll create a placeholder structure
      const arrayBuffer = await file.arrayBuffer();

      // TODO: Implement actual Excel parsing with xlsx library
      // const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      // const sheetName = workbook.SheetNames[0];
      // const worksheet = workbook.Sheets[sheetName];
      // const data = XLSX.utils.sheet_to_json(worksheet);

      // Placeholder extraction (will be replaced with actual parsing)
      const record: TrainerFeedbackRecord = {
        trainerName: file.name.replace(/\.(xlsx|csv)$/, '').split('-')[0] || 'Unknown Trainer',
        reviewPeriod: new Date().getFullYear().toString(),
        studio: 'Main Studio',
        clientFeedback: 'Imported from bulk upload',
        internalFeedback: 'Imported from bulk upload',
        focusPoints: 'Pending review',
        goals: 'Pending review',
        rawData: { fileName: file.name, uploadDate: new Date().toISOString() }
      };

      return record;
    } catch (error) {
      console.error('Error parsing file:', error);
      return null;
    }
  };

  const parseCSVFile = async (file: File): Promise<TrainerFeedbackRecord | null> => {
    try {
      const text = await file.text();
      const lines = text.split('\n');

      // Simple CSV parsing (would need more robust parsing in production)
      const record: TrainerFeedbackRecord = {
        trainerName: file.name.replace(/\.csv$/, '').split('-')[0] || 'Unknown Trainer',
        reviewPeriod: new Date().getFullYear().toString(),
        studio: 'Main Studio',
        clientFeedback: 'Imported from CSV',
        internalFeedback: 'Imported from CSV',
        focusPoints: 'Pending review',
        goals: 'Pending review',
        rawData: { fileName: file.name, uploadDate: new Date().toISOString(), lineCount: lines.length }
      };

      return record;
    } catch (error) {
      console.error('Error parsing CSV:', error);
      return null;
    }
  };

  const processFiles = async () => {
    if (files.length === 0) return;

    setUploading(true);
    setProgress(0);

    let successCount = 0;
    let failedCount = 0;
    const parsedRecords: TrainerFeedbackRecord[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setProgress(((i + 1) / files.length) * 100);

      try {
        let record: TrainerFeedbackRecord | null = null;

        if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
          record = await parseExcelFile(file);
        } else if (file.name.endsWith('.csv')) {
          record = await parseCSVFile(file);
        }

        if (record) {
          // Convert to ticket format for storage
          const { data, error } = await supabase
            .from('tickets')
            .insert({
              title: `Performance Review - ${record.trainerName} - ${record.reviewPeriod}`,
              description: `Bulk uploaded trainer performance review

TRAINER: ${record.trainerName}
REVIEW PERIOD: ${record.reviewPeriod}
STUDIO: ${record.studio}

${record.totalClassesTaught ? `Total Classes: ${record.totalClassesTaught}\n` : ''}${record.avgAttendance ? `Avg Attendance: ${record.avgAttendance}\n` : ''}${record.attendanceGrowth ? `Growth: ${record.attendanceGrowth}\n` : ''}
CLIENT FEEDBACK:
${record.clientFeedback}

INTERNAL FEEDBACK:
${record.internalFeedback}

FOCUS POINTS:
${record.focusPoints}

GOALS:
${record.goals}

${record.additionalNotes ? `ADDITIONAL NOTES:\n${record.additionalNotes}` : ''}`,
              priority: 'medium',
              status: 'new',
              source: 'bulk-upload',
              tags: ['trainer', 'performance-review', 'bulk-upload'],
              // Store raw data as metadata
              metadata: record.rawData
            });

          if (error) throw error;

          successCount++;
          parsedRecords.push(record);
        } else {
          failedCount++;
        }
      } catch (error) {
        console.error(`Error processing ${file.name}:`, error);
        failedCount++;
      }
    }

    setResults({
      success: successCount,
      failed: failedCount,
      records: parsedRecords
    });

    setUploading(false);
    setProgress(100);

    toast({
      title: "Upload Complete",
      description: `${successCount} reviews uploaded successfully. ${failedCount} failed.`,
      variant: successCount > 0 ? "default" : "destructive"
    });
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles(prev => [...prev, ...acceptedFiles]);
    setResults({ success: 0, failed: 0, records: [] });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'text/csv': ['.csv']
    },
    multiple: true
  });

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const downloadTemplate = () => {
    // This would generate a template Excel file
    toast({
      title: "Template Download",
      description: "Template download feature coming soon",
    });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Bulk Upload Trainer Reviews
            </CardTitle>
            <CardDescription>
              Upload multiple Excel or CSV files to automatically create performance review records
            </CardDescription>
          </div>
          <Button variant="outline" onClick={downloadTemplate} size="sm">
            <Download className="h-4 w-4 mr-2" />
            Template
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Dropzone */}
        <div
          {...getRootProps()}
          className={cn(
            "border-2 border-dashed rounded-xl p-8 transition-all cursor-pointer",
            isDragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
            files.length > 0 && "border-green-500/50 bg-green-50/50 dark:bg-green-950/20"
          )}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center justify-center text-center space-y-2">
            <Upload className={cn(
              "h-10 w-10 transition-colors",
              isDragActive ? "text-primary" : "text-muted-foreground"
            )} />
            <div>
              <p className="text-sm font-medium">
                {isDragActive ? "Drop files here" : "Drag & drop Excel/CSV files here"}
              </p>
              <p className="text-xs text-muted-foreground">
                or click to browse (.xlsx, .xls, .csv)
              </p>
            </div>
          </div>
        </div>

        {/* File List */}
        {files.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">{files.length} file(s) ready</p>
              <Button
                onClick={processFiles}
                disabled={uploading}
                size="sm"
                className="gap-2"
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Upload All
                  </>
                )}
              </Button>
            </div>

            <div className="space-y-1 max-h-60 overflow-y-auto">
              <AnimatePresence>
                {files.map((file, index) => (
                  <motion.div
                    key={file.name + index}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 text-sm"
                  >
                    <FileSpreadsheet className="h-4 w-4 text-blue-600" />
                    <span className="flex-1 truncate">{file.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {(file.size / 1024).toFixed(1)} KB
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                      disabled={uploading}
                      className="h-6 w-6 p-0"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* Progress */}
        {uploading && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Processing files...</span>
              <span className="font-medium">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {/* Results */}
        {results.success + results.failed > 0 && !uploading && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="default" className="gap-1">
                <Check className="h-3 w-3" />
                {results.success} Successful
              </Badge>
              {results.failed > 0 && (
                <Badge variant="destructive" className="gap-1">
                  <X className="h-3 w-3" />
                  {results.failed} Failed
                </Badge>
              )}
            </div>

            {results.records.length > 0 && (
              <div className="rounded-lg border p-3 bg-muted/30">
                <p className="text-xs font-semibold mb-2">Uploaded Records:</p>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {results.records.map((record, index) => (
                    <div key={index} className="text-xs bg-background p-2 rounded flex items-center gap-2">
                      <FileSpreadsheet className="h-3 w-3 text-green-600" />
                      <span className="font-medium">{record.trainerName}</span>
                      <span className="text-muted-foreground">•</span>
                      <span className="text-muted-foreground">{record.reviewPeriod}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Instructions */}
        <div className="rounded-lg border bg-blue-50/50 dark:bg-blue-950/20 p-3">
          <div className="flex gap-2">
            <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-xs space-y-1">
              <p className="font-medium text-blue-900 dark:text-blue-100">Upload Instructions:</p>
              <ul className="list-disc list-inside space-y-0.5 text-blue-800 dark:text-blue-200">
                <li>Upload Excel files (.xlsx, .xls) or CSV files</li>
                <li>Files should contain trainer name, metrics, and feedback</li>
                <li>Each file creates one performance review ticket</li>
                <li>Uploaded reviews appear in tickets with "performance-review" tag</li>
                <li>Review and edit details after upload if needed</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
