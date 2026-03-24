import { useMutation, useQuery } from '@tanstack/react-query';

import assignmentsApi, { SubmitAssignmentRequest } from '@/apis/assignments.api';

export const useAssignmentDetail = (courseId: string, assignmentId: string) =>
  useQuery({
    queryKey: ['assignment', courseId, assignmentId],
    queryFn: () => assignmentsApi.getById(courseId, assignmentId),
    enabled: !!courseId && !!assignmentId,
  });

export const useMySubmission = (courseId: string, assignmentId: string) =>
  useQuery({
    queryKey: ['my-submission', courseId, assignmentId],
    queryFn: () => assignmentsApi.getMySubmission(courseId, assignmentId),
    enabled: !!courseId && !!assignmentId,
  });

export const useSubmitAssignment = (courseId: string, assignmentId: string) =>
  useMutation({
    mutationFn: (data: SubmitAssignmentRequest) =>
      assignmentsApi.submit(courseId, assignmentId, data),
  });
