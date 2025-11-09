import React, { useState } from 'react';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';

type Theme = {
  bg: string;
  text: string;
  muted: string;
  btnNeutral: string;
  btnNeutralHover: string;
  accentPurpleGradient: string;
  border: string;
};

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  theme: Theme;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  theme,
}) => {
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 7;

    if (totalPages <= maxVisible) {
      // Hiển thị tất cả nếu ít trang
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Logic hiển thị với "..."
      if (currentPage <= 3) {
        // Đầu danh sách
        for (let i = 1; i <= 5; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        // Cuối danh sách
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
      } else {
        // Giữa danh sách
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  const handlePageClick = (page: number | string) => {
    if (typeof page === 'number') {
      onPageChange(page);
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      marginTop: '16px',
    }}>
      {/* Previous Button */}
      <button
        onClick={handlePrevious}
        disabled={currentPage === 1}
        style={{
          padding: '10px 16px',
          background: currentPage === 1 ? theme.btnNeutral : theme.btnNeutralHover,
          border: `1px solid ${theme.border}`,
          borderRadius: '8px',
          color: currentPage === 1 ? theme.muted : theme.text,
          fontSize: '14px',
          fontWeight: 600,
          cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s ease',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          opacity: currentPage === 1 ? 0.5 : 1,
        }}
        onMouseEnter={(e) => {
          if (currentPage !== 1) {
            e.currentTarget.style.background = theme.accentPurpleGradient;
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.35)';
          }
        }}
        onMouseLeave={(e) => {
          if (currentPage !== 1) {
            e.currentTarget.style.background = theme.btnNeutralHover;
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }
        }}
      >
        <LeftOutlined style={{ fontSize: '12px' }} />
        <span>Previous</span>
      </button>

      {/* Page Numbers */}
      <div style={{ display: 'flex', gap: '6px' }}>
        {getPageNumbers().map((page, index) => (
          <button
            key={index}
            onClick={() => handlePageClick(page)}
            disabled={page === '...'}
            style={{
              minWidth: '40px',
              height: '40px',
              padding: '8px 12px',
              background: currentPage === page
                ? theme.accentPurpleGradient
                : theme.btnNeutral,
              border: `1px solid ${currentPage === page ? 'transparent' : theme.border}`,
              borderRadius: '8px',
              color: currentPage === page ? '#fff' : theme.text,
              fontSize: '14px',
              fontWeight: currentPage === page ? 700 : 600,
              cursor: page === '...' ? 'default' : 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: currentPage === page
                ? '0 4px 12px rgba(16, 185, 129, 0.35)'
                : 'none',
            }}
            onMouseEnter={(e) => {
              if (currentPage !== page && page !== '...') {
                e.currentTarget.style.background = theme.btnNeutralHover;
                e.currentTarget.style.transform = 'translateY(-2px)';
              }
            }}
            onMouseLeave={(e) => {
              if (currentPage !== page && page !== '...') {
                e.currentTarget.style.background = theme.btnNeutral;
                e.currentTarget.style.transform = 'translateY(0)';
              }
            }}
          >
            {page}
          </button>
        ))}
      </div>

      {/* Next Button */}
      <button
        onClick={handleNext}
        disabled={currentPage === totalPages}
        style={{
          padding: '10px 16px',
          background: currentPage === totalPages ? theme.btnNeutral : theme.btnNeutralHover,
          border: `1px solid ${theme.border}`,
          borderRadius: '8px',
          color: currentPage === totalPages ? theme.muted : theme.text,
          fontSize: '14px',
          fontWeight: 600,
          cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s ease',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          opacity: currentPage === totalPages ? 0.5 : 1,
        }}
        onMouseEnter={(e) => {
          if (currentPage !== totalPages) {
            e.currentTarget.style.background = theme.accentPurpleGradient;
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.35)';
          }
        }}
        onMouseLeave={(e) => {
          if (currentPage !== totalPages) {
            e.currentTarget.style.background = theme.btnNeutralHover;
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }
        }}
      >
        <span>Next</span>
        <RightOutlined style={{ fontSize: '12px' }} />
      </button>

      {/* Page Info */}
      <div style={{
        marginLeft: '16px',
        padding: '10px 16px',
        background: theme.btnNeutral,
        border: `1px solid ${theme.border}`,
        borderRadius: '8px',
        color: theme.muted,
        fontSize: '13px',
        fontWeight: 500,
        whiteSpace: 'nowrap',
      }}>
        Page {currentPage} of {totalPages}
      </div>
    </div>
  );
};

export default Pagination;