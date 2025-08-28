import Papa from 'papaparse';

export interface Job {
  job_id: string;
  job_name: string;
  backend: string;
  backend_type: string;
  status: 'RUNNING' | 'QUEUED' | 'COMPLETED' | 'FAILED';
  creation_time: string;
  end_time: string | null;
  execution_time: string | null;
  shots: number;
  provider: string;
  target: string;
}

export async function loadJobs(): Promise<Job[]> {
  try {
    const response = await fetch('/data/quantum_job_data.csv');
    const csvText = await response.text();
    
    return new Promise((resolve, reject) => {
      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const jobs = results.data.map((row: any) => ({
            job_id: row['JOB ID'],
            job_name: row['JOB NAME'],
            backend: row['TARGET'],
            backend_type: row['BACKEND TYPE'],
            status: row['JOB STATUS'],
            creation_time: row['SUBMISSION TIME'],
            end_time: row['COMPLETION TIME'] === 'N/A' ? null : row['COMPLETION TIME'],
            execution_time: row['EXECUTION TIME (MS)'] === 'N/A' ? null : row['EXECUTION TIME (MS)'],
            shots: parseInt(row['SHOTS'], 10) || 0,
            provider: row['PROVIDER'],
            target: row['TARGET']
          }));
          resolve(jobs);
        },
        error: (error: Papa.ParseError) => {
          console.error('Error parsing CSV:', error);
          reject(error);
        }
      });
    });
  } catch (error) {
    console.error('Error loading jobs:', error);
    return [];
  }
}