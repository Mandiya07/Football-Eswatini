
import React, { useState } from 'react';
import { Card, CardContent } from './ui/Card';
import Button from './ui/Button';
import { submitContactInquiry } from '../services/api';
import Spinner from './ui/Spinner';
import CheckCircleIcon from './icons/CheckCircleIcon';

const ContactPage: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formData, setFormData] = useState({
      name: '',
      email: '',
      subject: '',
      message: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
        await submitContactInquiry(formData);
        setIsSuccess(true);
        setFormData({ name: '', email: '', subject: '', message: '' });
        setTimeout(() => setIsSuccess(false), 5000);
    } catch (error) {
        alert("Failed to send message. Please try again later.");
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <div className="py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 animate-fade-in">
            <div className="text-center mb-12">
                <h1 className="text-4xl md:text-5xl font-display font-extrabold text-blue-800 mb-2">
                    Get In Touch
                </h1>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                    Have a question, a news tip, or just want to say hello? We'd love to hear from you.
                </p>
            </div>

            <Card className="max-w-4xl mx-auto shadow-lg">
                <CardContent className="p-8 md:p-12">
                    {isSuccess ? (
                        <div className="text-center py-12 animate-in zoom-in duration-300">
                            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <CheckCircleIcon className="w-12 h-12 text-green-600" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Message Sent!</h2>
                            <p className="text-gray-600">Thank you for reaching out. Our team will get back to you as soon as possible.</p>
                            <Button onClick={() => setIsSuccess(false)} className="mt-8 bg-primary text-white">Send Another Message</Button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                    <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                                </div>
                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                                    <input type="email" name="email" id="email" value={formData.email} onChange={handleChange} required className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                                </div>
                            </div>
                            <div>
                                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                                <input type="text" name="subject" id="subject" value={formData.subject} onChange={handleChange} required className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                            </div>
                            <div>
                                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                                <textarea name="message" id="message" rows={5} value={formData.message} onChange={handleChange} required className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"></textarea>
                            </div>
                            <div className="text-right">
                                <Button type="submit" disabled={isSubmitting} className="bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 px-8 h-12 font-bold shadow-lg flex items-center justify-center ml-auto gap-2">
                                    {isSubmitting ? <Spinner className="w-5 h-5 border-white border-2" /> : 'Send Message'}
                                </Button>
                            </div>
                        </form>
                    )}
                </CardContent>
            </Card>
        </div>
    </div>
  );
};

export default ContactPage;
