'use client'

import React, { useState, useEffect, useRef } from 'react';
import { X, ChevronDown } from 'lucide-react';
import { Input, Label } from '@/app/components/globalComponents';
import fastAxiosInstance from '@/axiosConfig/axiosfig';

interface Skill {
  id: string;
  skill_name: string;
  skill_category: string | null;
}

interface SkillMultiSelectProps {
  selectedSkills: string[];
  onSkillsChange: (skills: string[]) => void;
  placeholder?: string;
  label?: string;
  className?: string;
}

export function SkillMultiSelect({
  selectedSkills,
  onSkillsChange,
  placeholder = "Type to search skills...",
  label = "Skills",
  className = ""
}: SkillMultiSelectProps) {
  const [query, setQuery] = useState('');
  const [filteredSkills, setFilteredSkills] = useState<Skill[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch all skills on mount for initial load
  useEffect(() => {
    const fetchSkills = async () => {
      try {
        setLoading(true);
        const response = await fastAxiosInstance.get('/api/skills/all');
        const data = response.data;
        if (Array.isArray(data.skills)) {
          setFilteredSkills(data.skills);
        }
      } catch (error) {
        console.error('Failed to fetch skills:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSkills();
  }, []);

  // Filter skills based on query
  useEffect(() => {
    const fetchFilteredSkills = async () => {
      if (query.trim() === '') {
        // If no query, show all skills
        try {
          const response = await fastAxiosInstance.get('/api/skills/all');
          const data = response.data;
          if (Array.isArray(data.skills)) {
            setFilteredSkills(data.skills.filter((skill: Skill) =>
              !selectedSkills.includes(skill.skill_name)
            ));
          }
        } catch (error) {
          console.error('Failed to fetch all skills:', error);
          setFilteredSkills([]);
        }
        return;
      }

      try {
        const response = await fastAxiosInstance.get('/api/skills', {
          params: { q: query }
        });
        const data = response.data;
        // Filter out already selected skills
        const availableSkills = data.skills.filter((skill: Skill) =>
          !selectedSkills.includes(skill.skill_name)
        );
        setFilteredSkills(availableSkills);
      } catch (error) {
        console.error('Failed to search skills:', error);
        setFilteredSkills([]);
      }
    };

    // Debounce the search
    const timeoutId = setTimeout(fetchFilteredSkills, 300);
    return () => clearTimeout(timeoutId);
  }, [query, selectedSkills]);

  // Handle clicking outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setIsOpen(true);
  };

  const handleSkillSelect = (skill: Skill) => {
    if (!selectedSkills.includes(skill.skill_name)) {
      onSkillsChange([...selectedSkills, skill.skill_name]);
    }
    setQuery('');
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const handleSkillRemove = (skillName: string) => {
    onSkillsChange(selectedSkills.filter(skill => skill !== skillName));
  };

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {label && <Label>{label}</Label>}

      {/* Selected Skills Tags */}
      {selectedSkills.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {selectedSkills.map((skill) => (
            <span
              key={skill}
              className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
            >
              {skill}
              <button
                type="button"
                onClick={() => handleSkillRemove(skill)}
                className="hover:bg-blue-200 rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Input and Dropdown Container */}
      <div className="relative" ref={dropdownRef}>
        <div className="relative">
          <Input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            placeholder={placeholder}
            className="pr-10"
          />
          <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>

        {/* Dropdown */}
        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
            {loading ? (
              <div className="px-4 py-2 text-gray-500 text-sm">Loading...</div>
            ) : filteredSkills.length > 0 ? (
              filteredSkills.map((skill) => (
                <button
                  key={skill.id}
                  type="button"
                  onClick={() => handleSkillSelect(skill)}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{skill.skill_name}</span>
                    {skill.skill_category && (
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                        {skill.skill_category}
                      </span>
                    )}
                  </div>
                </button>
              ))
            ) : query.trim() !== '' ? (
              <div className="px-4 py-2 text-gray-500 text-sm">
                No skills found matching &quot;{query}&quot;
              </div>
            ) : (
              <div className="px-4 py-2 text-gray-500 text-sm">
                Type to search for skills...
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
}