import * as React from "react";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange?: (page: number) => void;
  baseUrl?: string;
  query?: Record<string, string>;
  className?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  baseUrl,
  query = {},
  className,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    pages.push(i);
  }

  // A simple logic for ellipsis
  let visiblePages = pages;
  if (totalPages > 7) {
    if (currentPage <= 4) {
      visiblePages = [...pages.slice(0, 5), -1, totalPages];
    } else if (currentPage >= totalPages - 3) {
      visiblePages = [1, -1, ...pages.slice(totalPages - 5)];
    } else {
      visiblePages = [1, -1, currentPage - 1, currentPage, currentPage + 1, -1, totalPages];
    }
  }

  const getPageUrl = (page: number) => {
    if (!baseUrl) return "#";
    const params = new URLSearchParams(query);
    if (page > 1) params.set('page', page.toString());
    else params.delete('page');
    const queryString = params.toString();
    return `${baseUrl}${queryString ? `?${queryString}` : ''}`;
  };

  const renderButton = (page: number, label: React.ReactNode, icon?: React.ReactNode, disabled?: boolean) => {
    const isCurrent = currentPage === page;
    const content = icon || label;
    
    if (baseUrl && !disabled) {
      return (
        <Button
          asChild
          variant={isCurrent ? "default" : "ghost"}
          size={icon ? "icon" : "default"}
          className={cn(icon ? "h-9 w-9" : "px-4", !isCurrent && "text-muted-foreground")}
        >
          <Link href={getPageUrl(page)} aria-label={typeof label === 'string' ? label : undefined}>
            {content}
          </Link>
        </Button>
      );
    }

    return (
      <Button
        variant={isCurrent ? "default" : "ghost"}
        size={icon ? "icon" : "default"}
        onClick={() => onPageChange?.(page)}
        disabled={disabled}
        className={cn(icon ? "h-9 w-9" : "px-4", !isCurrent && "text-muted-foreground")}
      >
        {content}
      </Button>
    );
  };

  return (
    <nav
      role="navigation"
      aria-label="pagination"
      className={cn("mx-auto flex w-full justify-center", className)}
    >
      <ul className="flex flex-row items-center gap-1">
        <li>
          {renderButton(currentPage - 1, "Previous", <ChevronLeft className="h-4 w-4" />, currentPage === 1)}
        </li>
        {visiblePages.map((page, index) => {
          if (page === -1) {
            return (
              <li key={`ellipsis-${index}`}>
                <span className="flex h-9 w-9 items-center justify-center text-muted-foreground">
                  <MoreHorizontal className="h-4 w-4" />
                </span>
              </li>
            );
          }

          return (
            <li key={page}>
              {renderButton(page, page.toString())}
            </li>
          );
        })}
        <li>
          {renderButton(currentPage + 1, "Next", <ChevronRight className="h-4 w-4" />, currentPage === totalPages)}
        </li>
      </ul>
    </nav>
  );
}

