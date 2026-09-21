# frozen_string_literal: true

module RubyLLM
  class Judge
    module Data # :nodoc:
      module_function

      def copy(value, &resolver)
        case value
        when Proc then resolver ? copy(resolver.call(value), &resolver) : value
        when Hash then copy_hash(value, &resolver)
        when Array then value.map { |item| copy(item, &resolver) }.freeze
        when String then value.dup.freeze
        when Symbol then value.to_s.freeze
        when Float
          raise ArgumentError, 'Judgment data must contain finite numbers' unless value.finite?

          value
        when Integer, TrueClass, FalseClass, NilClass then value
        else raise ArgumentError, "Unsupported judgment data: #{value.class}; pass JSON-compatible values"
        end
      end

      def copy_hash(value, &resolver)
        seen = {}
        value.each_with_object({}) do |(key, item), result|
          name = key.to_s
          unless key.is_a?(String) || key.is_a?(Symbol) || key == true || key == false
            raise ArgumentError, 'Judgment data keys must be Strings, Symbols, or booleans'
          end
          raise ArgumentError, "Duplicate judgment key: #{name}" if seen[name]

          seen[name] = true
          result[key.is_a?(String) ? key.dup.freeze : key] = copy(item, &resolver)
        end.freeze
      end

      def description?(value)
        value.nil? || value.is_a?(String) || value.is_a?(Hash) || value.is_a?(Array)
      end
    end
  end
end
